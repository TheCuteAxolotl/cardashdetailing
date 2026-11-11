import assert from "node:assert/strict";
import type { DiscountCode } from "../src/lib/booking-pricing";
import type { Order } from "../src/lib/shop";
import { evaluateShopDiscount } from "../src/lib/shop-discounts";

const now = new Date("2026-11-10T18:00:00-06:00");
const base: DiscountCode = {
  id: "shop-promo",
  code: "MERCH20",
  label: "20% off merch",
  type: "percent",
  scope: "shop",
  amount: 20,
  active: true,
  usageLimit: null,
  onePerCustomer: false,
  expiresAt: null,
  appliesTo: null,
};
const verify = (discount: DiscountCode, orders: Order[] = [], email = "") =>
  evaluateShopDiscount({ codes: [discount], orders, code: discount.code, priceCents: 5999, email, now });
const paid: Order = {
  id: "paid-1",
  variant: "shirt-L",
  item: "Shirt / Black / L",
  cents: 4799,
  session: "cs_paid",
  held: true,
  status: "ready",
  customerEmail: "customer@example.com",
  discountCode: "MERCH20",
  paidAt: now.getTime() - 10_000,
};
const percent = verify(base);
assert.equal(percent.ok, true);
if (percent.ok) {
  assert.equal(percent.savedCents, 1200);
  assert.equal(percent.totalCents, 4799);
}
const fixed = verify({ ...base, type: "fixed", amount: 12 });
assert.equal(fixed.ok, true);
if (fixed.ok) {
  assert.equal(fixed.savedCents, 1200);
  assert.equal(fixed.totalCents, 4799);
}
assert.equal(verify({ ...base, type: "percent", amount: 100 }).ok, true);
const free = verify({ ...base, type: "percent", amount: 100 });
if (free.ok) assert.equal(free.totalCents, 0);
assert.equal(verify({ ...base, scope: "booking" }).ok, false);
assert.equal(verify({ ...base, active: false }).ok, false);
assert.equal(verify({ ...base, expiresAt: "2026-11-09" }).ok, false);
assert.equal(verify({ ...base, usageLimit: 1 }, [paid]).ok, false);
assert.equal(verify({ ...base, usageLimit: 2 }, [paid]).ok, true);
assert.equal(verify({ ...base, onePerCustomer: true }, [paid], "customer@example.com").ok, false);
assert.equal(verify({ ...base, onePerCustomer: true }, [paid], "new@example.com").ok, true);
assert.equal(verify({ ...base, onePerCustomer: true }, [paid]).ok, false);
const pending: Order = {
  ...paid, id: "checkout-2", status: "checkout", paidAt: undefined,
  checkoutCreatedAt: now.getTime() - 60_000,
};
assert.equal(verify({ ...base, usageLimit: 1 }, [pending]).ok, false);
assert.equal(verify({ ...base, usageLimit: 1 }, [{ ...pending, checkoutCreatedAt: now.getTime() - 40 * 60_000 }]).ok, true);
console.log("Merch discounts: scope, percent/fixed/free totals, redemption limits, expiration and one-per-customer verified.");
