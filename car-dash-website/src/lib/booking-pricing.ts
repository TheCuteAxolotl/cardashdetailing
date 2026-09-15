export type BookingAddOn = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

export type BookingPricingConfig = {
  headlightStandalonePrice: number;
  addOns: BookingAddOn[];
};

export type DiscountType = "percent" | "fixed" | "set_service_price";

export type DiscountCode = {
  id: string;
  code: string;
  label: string;
  type: DiscountType;
  amount: number;
  active: boolean;
  usageLimit: number | null;
  onePerCustomer: boolean;
  expiresAt: string | null;
  appliesTo: string | null;
};

export const STANDALONE_HEADLIGHT_SERVICE_ID = "__headlight_restoration__";
export const DISCOUNT_CODES_KEY = "discountCodesConfig";

export const DEFAULT_BOOKING_PRICING: BookingPricingConfig = {
  headlightStandalonePrice: 99,
  addOns: [
    { id: "pet-hair", name: "Pet Hair Removal", price: 39, active: true },
    { id: "seat-shampoo", name: "Seat Shampoo", price: 49, active: true },
    { id: "carpet-extraction", name: "Carpet Extraction", price: 59, active: true },
    { id: "heavy-stains", name: "Heavy Stain Removal", price: 69, active: true },
    { id: "leather-protection", name: "Leather Protection", price: 39, active: true },
    { id: "odor-treatment", name: "Odor Treatment", price: 49, active: true },
    { id: "engine-bay", name: "Engine Bay Cleaning", price: 49, active: true },
    { id: "iron-decon", name: "Iron Decontamination", price: 45, active: true },
    { id: "clay-bar", name: "Clay Bar Treatment", price: 59, active: true },
    { id: "hand-wax", name: "Hand Wax", price: 49, active: true },
    { id: "ceramic-sealant", name: "Ceramic Sealant", price: 79, active: true },
    { id: "wheel-coating", name: "Wheel Coating", price: 89, active: true },
    { id: "trim-protection", name: "Exterior Trim Protection", price: 45, active: true },
    { id: "bug-tar", name: "Bug & Tar Removal", price: 35, active: true },
    { id: "underbody", name: "Underbody Cleaning", price: 30, active: true },
    { id: "headlight-restoration", name: "Headlight Restoration", price: 80, active: true },
  ],
};

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function parseBookingPricingConfig(value: string | null | undefined): BookingPricingConfig {
  try {
    const parsed = JSON.parse(value || "") as Partial<BookingPricingConfig>;
    if (!parsed || !Array.isArray(parsed.addOns)) return DEFAULT_BOOKING_PRICING;
    const addOns = parsed.addOns
      .map((item, index) => ({
        id: String(item?.id || `addon-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") || `addon-${index + 1}`,
        name: String(item?.name || "Add-On").trim().slice(0, 80),
        price: safeNumber(item?.price, 0),
        active: item?.active !== false,
      }))
      .filter((item) => item.name && item.price >= 0);

    return {
      headlightStandalonePrice: safeNumber(parsed.headlightStandalonePrice, DEFAULT_BOOKING_PRICING.headlightStandalonePrice),
      addOns,
    };
  } catch {
    return DEFAULT_BOOKING_PRICING;
  }
}

export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

export function normalizeDiscountTarget(value: unknown) {
  const target = String(value || "").trim().slice(0, 180);
  if (!target) return null;
  if (/^package:(packages|exterior|interior):[^\s:][^\s]*$/i.test(target)) return target;
  if (/^service:[^\s:][^\s]*$/i.test(target)) return target;
  return null;
}

export function parseDiscountCodes(value: string | null | undefined): DiscountCode[] {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any, index) => {
        const type: DiscountType = item?.type === "fixed"
          ? "fixed"
          : item?.type === "set_service_price"
            ? "set_service_price"
            : "percent";
        const amount = safeNumber(item?.amount, 0);
        return {
          id: String(item?.id || `discount-${index + 1}`).slice(0, 80),
          code: normalizeDiscountCode(String(item?.code || "")),
          label: String(item?.label || "").trim().slice(0, 120),
          type,
          amount: type === "percent" ? Math.min(amount, 100) : amount,
          active: item?.active !== false,
          usageLimit: Number.isFinite(Number(item?.usageLimit)) && Number(item?.usageLimit) > 0 ? Math.floor(Number(item.usageLimit)) : null,
          onePerCustomer: item?.onePerCustomer === true,
          expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(String(item?.expiresAt || "")) ? String(item.expiresAt) : null,
          appliesTo: normalizeDiscountTarget(item?.appliesTo),
        } as DiscountCode;
      })
      .filter((item) => item.code && item.amount > 0);
  } catch {
    return [];
  }
}

export function discountAppliesToTarget(
  discount: Pick<DiscountCode, "appliesTo"> | null | undefined,
  target: string | null | undefined,
) {
  if (!discount?.appliesTo) return true;
  return Boolean(target && discount.appliesTo === target);
}

export function calculateDiscount(
  subtotal: number,
  discount: Pick<DiscountCode, "type" | "amount"> | null | undefined,
  baseServicePrice = subtotal,
) {
  if (!discount || subtotal <= 0) return 0;

  let raw = 0;
  if (discount.type === "percent") {
    raw = subtotal * (discount.amount / 100);
  } else if (discount.type === "fixed") {
    raw = discount.amount;
  } else {
    const servicePrice = Math.max(0, Math.min(subtotal, Number(baseServicePrice) || 0));
    raw = Math.max(0, servicePrice - discount.amount);
  }

  return Math.max(0, Math.min(subtotal, Math.round(raw * 100) / 100));
}

export function describeDiscount(discount: Pick<DiscountCode, "type" | "amount">) {
  if (discount.type === "percent") return `${discount.amount}%`;
  if (discount.type === "set_service_price") return `sets service to $${discount.amount.toFixed(2)}`;
  return `$${discount.amount.toFixed(2)}`;
}

export function getDiscountUsageMarker(code: string) {
  return `Discount: ${normalizeDiscountCode(code)} (`;
}

export function extractDiscountCodeFromBookingNotes(notes: string | null | undefined) {
  if (!notes) return null;
  const line = notes.split("\n").find((entry) => entry.startsWith("Discount: "));
  if (!line) return null;
  const start = "Discount: ".length;
  const end = line.indexOf(" (", start);
  if (end <= start) return null;
  return normalizeDiscountCode(line.slice(start, end));
}

function dateOnlyInChicago(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

export function isDiscountExpired(discount: Pick<DiscountCode, "expiresAt">, now = new Date()) {
  return Boolean(discount.expiresAt && discount.expiresAt < dateOnlyInChicago(now));
}
