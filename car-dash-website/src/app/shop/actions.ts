"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DISCOUNT_CODES_KEY, normalizeDiscountCode, parseDiscountCodes } from "@/lib/booking-pricing";
import { changeShop } from "@/lib/shop";
import { evaluateShopDiscount } from "@/lib/shop-discounts";
import { stripeRequest } from "@/lib/stripe-invoice";

export type ShopCheckoutState = { error: string };

export async function checkout(_previous: ShopCheckoutState, form: FormData): Promise<ShopCheckoutState> {
  let url: string;
  try {
    const discountCode = normalizeDiscountCode(String(form.get("discountCode") || ""));
    const email = String(form.get("email") || "").trim().toLowerCase();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { error: "Enter a valid email address or leave the email field blank." };
    }

    const savedCodes = discountCode
      ? await prisma.siteContent.findUnique({ where: { key: DISCOUNT_CODES_KEY } })
      : null;
    const codes = parseDiscountCodes(savedCodes?.value);

    url = await changeShop(async (shop) => {
      const v = shop.variants.find((variant) => variant.id === form.get("variant") && variant.published);
      if (!v || (v.stock === 0) !== (form.get("reserve") === "yes")) {
        throw Error("Availability changed. Refresh the shop before checking out.");
      }

      const discount = discountCode
        ? evaluateShopDiscount({ codes, orders: shop.orders, code: discountCode, priceCents: v.cents, email })
        : null;
      if (discount && !discount.ok) throw Error(discount.message);
      const totalCents = discount?.ok ? discount.totalCents : v.cents;

      const held = v.stock > 0;
      const item = [v.name, v.color, v.size].join(" / ");
      const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://cardashdetailing.com").replace(/\/$/, "");
      const id = crypto.randomUUID();
      const body = new URLSearchParams({
        mode: "payment",
        "payment_method_types[0]": "card",
        "metadata[merch_order]": id,
        "shipping_address_collection[allowed_countries][0]": "US",
        "phone_number_collection[enabled]": "true",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(totalCents),
        "line_items[0][price_data][product_data][name]": (held ? "" : "Paid reservation — ") + item,
        success_url: base + "/shop?received=1",
        cancel_url: base + "/shop",
        expires_at: String(Math.floor(Date.now() / 1000) + 1860),
      });
      if (email) body.set("customer_email", email);
      if (discount?.ok) {
        body.set("metadata[merch_discount]", discount.code);
        body.set("metadata[merch_original_cents]", String(v.cents));
      }
      const session = await stripeRequest("/v1/checkout/sessions", { method: "POST", body });
      if (!session.url) throw Error("Checkout unavailable.");
      if (held) v.stock--;
      shop.orders.push({
        id,
        variant: v.id,
        item,
        cents: totalCents,
        originalCents: v.cents,
        discountCode: discount?.ok ? discount.code : undefined,
        customerEmail: email || undefined,
        checkoutCreatedAt: Date.now(),
        held,
        status: "checkout",
        session: session.id,
      });
      return String(session.url);
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to start checkout." };
  }
  redirect(url);
}
