"use server";
import { redirect } from "next/navigation";
import { changeShop } from "@/lib/shop";
import { stripeRequest } from "@/lib/stripe-invoice";
export async function checkout(form: FormData) {
  const url = await changeShop(async (shop) => {
    const v = shop.variants.find(
      (v) => v.id === form.get("variant") && v.published,
    );
    if (!v || (v.stock === 0) !== (form.get("reserve") === "yes"))
      throw Error(
        "Availability changed. Refresh the shop before checking out.",
      );
    const held = v.stock > 0;
    const item = [v.name, v.color, v.size].join(" / ");
    const base = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://cardashdetailing.com"
    ).replace(/\/$/, "");
    const id = crypto.randomUUID();
    const body = new URLSearchParams({
      mode: "payment",
      "payment_method_types[0]": "card",
      "metadata[merch_order]": id,
      "shipping_address_collection[allowed_countries][0]": "US",
      "phone_number_collection[enabled]": "true",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(v.cents),
      "line_items[0][price_data][product_data][name]":
        (held ? "" : "Paid reservation — ") + item,
      success_url: base + "/shop?received=1",
      cancel_url: base + "/shop",
      expires_at: String(Math.floor(Date.now() / 1000) + 1860),
    });
    const session = await stripeRequest("/v1/checkout/sessions", {
      method: "POST",
      body,
    });
    if (!session.url) throw Error("Checkout unavailable.");
    if (held) v.stock--;
    shop.orders.push({
      id,
      variant: v.id,
      item,
      cents: v.cents,
      held,
      status: "checkout",
      session: session.id,
    });
    return String(session.url);
  });
  redirect(url);
}
