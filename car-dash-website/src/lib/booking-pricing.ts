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

export type DiscountCode = {
  id: string;
  code: string;
  label: string;
  type: "percent" | "fixed";
  amount: number;
  active: boolean;
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

export function parseDiscountCodes(value: string | null | undefined): DiscountCode[] {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any, index) => {
        const type = item?.type === "fixed" ? "fixed" : "percent";
        const amount = safeNumber(item?.amount, 0);
        return {
          id: String(item?.id || `discount-${index + 1}`).slice(0, 80),
          code: normalizeDiscountCode(String(item?.code || "")),
          label: String(item?.label || "").trim().slice(0, 120),
          type,
          amount: type === "percent" ? Math.min(amount, 100) : amount,
          active: item?.active !== false,
        } as DiscountCode;
      })
      .filter((item) => item.code && item.amount > 0);
  } catch {
    return [];
  }
}

export function calculateDiscount(subtotal: number, discount: Pick<DiscountCode, "type" | "amount"> | null | undefined) {
  if (!discount || subtotal <= 0) return 0;
  const raw = discount.type === "percent" ? subtotal * (discount.amount / 100) : discount.amount;
  return Math.max(0, Math.min(subtotal, Math.round(raw * 100) / 100));
}
