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
  deleted?: boolean;
};
export type Order = {
  id: string;
  variant: string;
  item: string;
  cents: number;
  originalCents?: number;
  discountCode?: string;
  checkoutCreatedAt?: number;
  session: string;
  held: boolean;
  status: "checkout" | "reserved" | "ready" | "ordered" | "shipped" | "expired";
  recipient?: string; // Legacy one-line shipping detail
  shipping?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerEmail?: string;
  customerPhone?: string;
  supplierOrderId?: string;
  orderedAt?: number;
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
type Ship = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  phone?: string | null;
};

/** Only transition an unpaid order once. Webhook retries cannot create duplicate paid orders. */
export async function syncShopSession(session: StripeCheckoutSession): Promise<Order | null> {
  // Stripe's complete Session includes shipping details across supported API versions.
  const details = (session.payment_status === "paid" || session.payment_status === "no_payment_required")
    ? (await stripeRequest("/v1/checkout/sessions/" + encodeURIComponent(session.id)) as StripeCheckoutSession & {
        collected_information?: { shipping_details?: Ship | null };
        shipping_details?: Ship | null;
        customer_details?: { email?: string | null; phone?: string | null };
      })
    : session;
  return changeShop((shop) => {
    const order = shop.orders.find((o) => o.session === details.id);
    if (!order || order.status !== "checkout") return null;
    const variant = shop.variants.find((v) => v.id === order.variant);
    if (!variant) throw Error("Merch variant missing for checkout.");
    if (
      (details.payment_status === "paid" || (order.cents === 0 && details.payment_status === "no_payment_required" && details.status === "complete")) &&
      details.amount_total === order.cents &&
      details.currency?.toLowerCase() === "usd"
    ) {
      const paid = details as typeof details & {
        collected_information?: { shipping_details?: Ship | null };
        shipping_details?: Ship | null;
        customer_details?: { email?: string | null; phone?: string | null };
      };
      const ship = paid.collected_information?.shipping_details ?? paid.shipping_details;
      const address = ship?.address;
      if (address) {
        order.shipping = {
          name: String(ship?.name || "").trim(),
          line1: String(address.line1 || "").trim(),
          line2: String(address.line2 || "").trim(),
          city: String(address.city || "").trim(),
          state: String(address.state || "").trim(),
          postalCode: String(address.postal_code || "").trim(),
          country: String(address.country || "").trim(),
        };
        order.recipient = [
          order.shipping.name,
          order.shipping.line1,
          order.shipping.line2,
          [order.shipping.city, order.shipping.state, order.shipping.postalCode].filter(Boolean).join(" "),
          order.shipping.country,
        ].filter(Boolean).join("\n");
      }
      order.customerEmail = String(paid.customer_details?.email || order.customerEmail || "").trim();
      order.customerPhone = String(paid.customer_details?.phone || ship?.phone || "").trim();
      order.status = order.held ? "ready" : "reserved";
      order.paidAt = Date.now();
      allocate(shop, variant);
      return { ...order };
    }
    if (details.status === "expired") {
      if (order.held) variant.stock++;
      order.status = "expired";
    }
    return null;
  });
}

export async function reconcile(): Promise<void> {
  const pending = (await readShop()).orders.filter((o) => o.status === "checkout");
  for (const order of pending) {
    const paid = await syncShopSession(
      await stripeRequest("/v1/checkout/sessions/" + encodeURIComponent(order.session)),
    );
    if (paid) {
      const { notifyMerchDiscord } = await import("@/lib/shop-notifications");
      await notifyMerchDiscord(paid);
    }
  }
}
