import prisma from "@/lib/prisma";
import {
  stripeRequest,
  type StripeCheckoutSession,
} from "@/lib/stripe-invoice";

export type Variant = {
  id: string;
  name: string;
  description: string;
  size: string;
  color: string;
  guide: string;
  image: string;
  images?: string[];
  cents: number;
  stock: number;
  eta: string;
  published: boolean;
};
export type Order = {
  id: string;
  variant: string;
  item: string;
  cents: number;
  session: string;
  held: boolean;
  status: "checkout" | "reserved" | "ready" | "shipped" | "expired";
  recipient?: string;
  tracking?: string;
  paidAt?: number;
};
type Shop = { variants: Variant[]; orders: Order[] };
let initialized: Promise<unknown> | undefined;
async function init() {
  initialized ??= prisma
    .$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(83617422)`;
      await tx.$executeRaw`CREATE TABLE IF NOT EXISTS car_dash_merch (id integer PRIMARY KEY, state jsonb NOT NULL)`;
      await tx.$executeRaw`INSERT INTO car_dash_merch VALUES (1,'{"variants":[],"orders":[]}') ON CONFLICT DO NOTHING`;
    })
    .catch((error) => {
      initialized = undefined;
      throw error;
    });
  await initialized;
}
export async function readShop(): Promise<Shop> {
  await init();
  const [row] = await prisma.$queryRaw<
    { state: Shop }[]
  >`SELECT state FROM car_dash_merch WHERE id=1`;
  return row.state;
}
export async function changeShop<T>(fn: (shop: Shop) => Promise<T> | T) {
  await init();
  return prisma.$transaction(
    async (tx) => {
      const [row] = await tx.$queryRaw<
        { state: Shop }[]
      >`SELECT state FROM car_dash_merch WHERE id=1 FOR UPDATE`;
      const result = await fn(row.state);
      await tx.$executeRaw`UPDATE car_dash_merch SET state=${JSON.stringify(row.state)}::jsonb WHERE id=1`;
      return result;
    },
    { timeout: 20000 },
  );
}
export function allocate(shop: Shop, v: Variant) {
  const queue = shop.orders
    .filter((o) => o.variant === v.id && o.status === "reserved")
    .sort((a, b) => (a.paidAt ?? 0) - (b.paidAt ?? 0));
  for (const order of queue) {
    if (v.stock === 0) break;
    v.stock--;
    order.status = "ready";
  }
}
export async function syncShopSession(session: StripeCheckoutSession) {
  await changeShop((shop) => {
    const order = shop.orders.find((o) => o.session === session.id);
    if (!order || order.status !== "checkout") return;
    const v = shop.variants.find((v) => v.id === order.variant)!;
    if (
      session.payment_status === "paid" &&
      session.amount_total === order.cents &&
      session.currency === "usd"
    ) {
      const details = session as StripeCheckoutSession & {
        shipping_details?: Ship;
        collected_information?: { shipping_details?: Ship };
        customer_details?: { email?: string };
      };
      const ship =
        details.collected_information?.shipping_details ??
        details.shipping_details;
      order.recipient = [
        ship?.name,
        ...Object.values(ship?.address ?? {}),
        details.customer_details?.email,
      ]
        .filter(Boolean)
        .join(", ");
      order.status = order.held ? "ready" : "reserved";
      order.paidAt = Date.now();
    } else if (session.status === "expired") {
      if (order.held) v.stock++;
      order.status = "expired";
    }
    allocate(shop, v);
  });
}
type Ship = { name: string; address: Record<string, string> };
export async function reconcile() {
  const pending = (await readShop()).orders.filter(
    (o) => o.status === "checkout",
  );
  for (const o of pending)
    await syncShopSession(
      await stripeRequest(
        "/v1/checkout/sessions/" + encodeURIComponent(o.session),
      ),
    );
}
