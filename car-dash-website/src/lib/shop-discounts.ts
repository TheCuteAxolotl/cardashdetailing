import type { DiscountCode } from "@/lib/booking-pricing";
import { isDiscountExpired, normalizeDiscountCode } from "@/lib/booking-pricing";
import type { Order } from "@/lib/shop";

export type ShopDiscountResult =
  | { ok: false; message: string }
  | { ok: true; code: string; label: string; savedCents: number; totalCents: number };

export function evaluateShopDiscount({
  codes,
  orders,
  code: inputCode,
  priceCents,
  email = "",
  now = new Date(),
}: {
  codes: DiscountCode[];
  orders: Order[];
  code: string;
  priceCents: number;
  email?: string;
  now?: Date;
}): ShopDiscountResult {
  const code = normalizeDiscountCode(inputCode);
  const discount = codes.find((item) => item.code === code && item.scope === "shop");
  if (!discount) return { ok: false, message: "That code is not valid for merchandise." };
  if (!discount.active) return { ok: false, message: "That promo code is inactive." };
  if (isDiscountExpired(discount, now)) return { ok: false, message: "That promo code has expired." };
  if (discount.type === "set_service_price") return { ok: false, message: "This code cannot be used in the shop." };

  // Include recently opened Stripe checkouts so simultaneous buyers cannot exceed
  // the allowed redemptions before Stripe sends payment webhooks.
  const relevant = orders.filter((order) =>
    order.discountCode === code &&
    (Boolean(order.paidAt) ||
      (order.status === "checkout" &&
        typeof order.checkoutCreatedAt === "number" &&
        now.getTime() - order.checkoutCreatedAt < 33 * 60 * 1000 &&
        now.getTime() >= order.checkoutCreatedAt))
  );
  if (discount.usageLimit !== null && relevant.length >= discount.usageLimit) {
    return { ok: false, message: "That promo code has reached its usage limit." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (discount.onePerCustomer) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return { ok: false, message: "Enter your email to use this one-time promo code." };
    }
    if (relevant.some((order) => order.customerEmail?.trim().toLowerCase() === normalizedEmail)) {
      return { ok: false, message: "This promo code can only be used once per customer." };
    }
  }

  const savedCents = Math.max(0, Math.min(priceCents, Math.round(
    discount.type === "percent" ? priceCents * discount.amount / 100 : discount.amount * 100
  )));
  return {
    ok: true,
    code,
    label: discount.label || code,
    savedCents,
    totalCents: Math.max(0, priceCents - savedCents),
  };
}
