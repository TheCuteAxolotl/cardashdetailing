// Shared by the owner booking form (browser), the booking APIs and invoice
// creation. Pure functions only: no database access, safe to bundle client-side.
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS, parsePricingConfig, type VehicleClass } from "@/lib/pricing-config";
import { parseBookingPricingConfig, STANDALONE_HEADLIGHT_SERVICE_ID, type BookingAddOn } from "@/lib/booking-pricing";
import { recommendedServiceMinutes, totalBookingMinutes } from "@/lib/booking-duration";

/** The saved site-content values the catalog is built from. */
export type CatalogSource = {
  pricingPackagesConfig?: string | null;
  pricingExteriorConfig?: string | null;
  pricingInteriorConfig?: string | null;
  bookingPricingConfig?: string | null;
};
export const CATALOG_SOURCE_KEYS = ["pricingPackagesConfig", "pricingExteriorConfig", "pricingInteriorConfig", "bookingPricingConfig"] as const;

export type CatalogService = {
  key: string;
  group: string;
  label: string;
  serviceName: string;
  price: number;
  durationTarget: string;
};

export const CUSTOM_SERVICE_KEY = "custom";
export const KEEP_SERVICE_KEY = "keep";
export const VEHICLE_CLASSES = Object.keys(VEHICLE_LABELS) as VehicleClass[];

const PAGES = [
  ["packages", "Detail packages", "pricingPackagesConfig"],
  ["interior", "Interior", "pricingInteriorConfig"],
  ["exterior", "Exterior", "pricingExteriorConfig"],
] as const;

const cents = (value: number) => Math.round(value * 100) / 100;

export function isVehicleClass(value: unknown): value is VehicleClass {
  return typeof value === "string" && value in VEHICLE_LABELS;
}

/** Every service with a listed price for the chosen vehicle size, in menu order. */
export function catalogServices(source: CatalogSource, vehicleClass: VehicleClass): CatalogService[] {
  const services: CatalogService[] = [];
  for (const [page, group, field] of PAGES) {
    const config = parsePricingConfig(source[field], DEFAULT_PRICING_PAGES[page]);
    for (const pkg of config.packages) {
      const price = Number(pkg.prices?.[vehicleClass]);
      if (!Number.isFinite(price) || price <= 0) continue;
      services.push({
        key: `package:${page}:${pkg.id}`,
        group,
        label: pkg.name,
        // Same naming the online booking flow uses, so reports stay consistent.
        serviceName: `${pkg.name} — ${VEHICLE_LABELS[vehicleClass]}`,
        price,
        durationTarget: `package:${page}:${pkg.id}:${vehicleClass}`,
      });
    }
  }
  const pricing = parseBookingPricingConfig(source.bookingPricingConfig);
  if (pricing.headlightStandalonePrice > 0) {
    services.push({
      key: `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`,
      group: "Other services",
      label: "Headlight Restoration",
      serviceName: "Headlight Restoration",
      price: pricing.headlightStandalonePrice,
      durationTarget: `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`,
    });
  }
  return services;
}

export function catalogAddOns(source: CatalogSource): BookingAddOn[] {
  return parseBookingPricingConfig(source.bookingPricingConfig).addOns.filter((item) => item.active && item.price >= 0);
}

export type OwnerPricingInput = {
  vehicleClass?: unknown;
  serviceKey?: unknown;
  customServiceName?: unknown;
  pricingMode?: unknown;
  customPrice?: unknown;
  addOnIds?: unknown;
};

export type OwnerPricingResult =
  | { ok: true; serviceName: string; servicePrice: number | null; addOns: BookingAddOn[]; quotedPrice: number | null; noteLines: string[] }
  | { ok: false; error: string };

/**
 * Turns the owner's choices (vehicle size, service, add-ons, listed or custom
 * price) into the booking's service name, total and the price lines saved in
 * its notes. Prices are always re-read from the saved menu, never trusted
 * from the browser, except a custom price the owner typed on purpose.
 */
export function resolveOwnerPricing(input: OwnerPricingInput, source: CatalogSource): OwnerPricingResult {
  const vehicleClass: VehicleClass = isVehicleClass(input.vehicleClass) ? input.vehicleClass : "coupe";
  const serviceKey = String(input.serviceKey ?? "").trim();
  if (!serviceKey) return { ok: false, error: "Choose a service." };

  let serviceName = "";
  let listedPrice: number | null = null;
  let durationTarget: string | null = null;
  if (serviceKey === CUSTOM_SERVICE_KEY) {
    serviceName = String(input.customServiceName ?? "").trim().slice(0, 160);
    if (!serviceName) return { ok: false, error: "Enter a name for the custom service." };
  } else {
    const service = catalogServices(source, vehicleClass).find((item) => item.key === serviceKey);
    if (!service) return { ok: false, error: "That service is no longer on the price list. Choose it again." };
    serviceName = service.serviceName;
    listedPrice = service.price;
    durationTarget = service.durationTarget;
  }

  const custom = input.pricingMode === "custom" || listedPrice === null;
  let servicePrice: number | null = listedPrice;
  if (custom) {
    const raw = String(input.customPrice ?? "").trim();
    if (raw === "") servicePrice = null;
    else {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 100000) return { ok: false, error: "Enter a valid custom price." };
      servicePrice = cents(value);
    }
  }

  const available = catalogAddOns(source);
  const requested = Array.isArray(input.addOnIds) ? input.addOnIds.map(String).slice(0, 40) : [];
  const addOns: BookingAddOn[] = [];
  for (const id of new Set(requested)) {
    const addOn = available.find((item) => item.id === id);
    if (!addOn) return { ok: false, error: "One of the add-ons changed or was removed. Choose the add-ons again." };
    addOns.push(addOn);
  }
  const addOnsTotal = cents(addOns.reduce((sum, item) => sum + item.price, 0));
  const quotedPrice = servicePrice === null ? null : cents(servicePrice + addOnsTotal);

  const pricing = parseBookingPricingConfig(source.bookingPricingConfig);
  const configured = durationTarget ? pricing.serviceDurations[durationTarget] : undefined;
  const minutes = totalBookingMinutes(serviceName, addOns, configured ?? recommendedServiceMinutes(durationTarget, serviceName));

  const noteLines = [
    `Estimated duration minutes: ${minutes}`,
    servicePrice !== null ? `Base service: $${servicePrice.toFixed(2)}` : null,
    `Add-ons: ${addOns.length ? addOns.map((item) => `${item.name} (+$${item.price.toFixed(2)})`).join(", ") : "None"}`,
    `Add-ons total: ${addOnsTotal.toFixed(2)}`,
    `Pricing: ${custom ? "Custom price" : "Listed price"}`,
    `Vehicle type: ${VEHICLE_LABELS[vehicleClass]}`,
    quotedPrice !== null ? `Booking total: $${quotedPrice.toFixed(2)}` : null,
  ].filter((line): line is string => Boolean(line));

  return { ok: true, serviceName, servicePrice, addOns, quotedPrice, noteLines };
}

const PRICE_LINE = /^(Estimated duration minutes|Base service|Add-ons|Add-ons total|Automatic promotion savings|Automatic promotion campaign|Automatic promotion|Discount|Booking total|Pricing|Vehicle type):/;

/** Swap a booking's saved price lines for new ones, keeping every other note. */
export function replacePricingNoteLines(notes: string | null | undefined, lines: string[]) {
  const rest = String(notes || "").split("\n").filter((line) => !PRICE_LINE.test(line));
  return [...lines, ...rest].join("\n").trim();
}

export type BookingInvoiceItems = {
  lineItems: Array<{ id: string; description: string; quantity: number; rate: number }>;
  discountAmount: number;
};

/**
 * Invoice lines for a booking: the service and each add-on on their own line.
 * Promotions, discount codes or a lower agreed total show as a discount; a
 * higher agreed total shows as a price adjustment, so the invoice always adds
 * up to the amount actually charged. Older bookings without a saved price
 * breakdown fall back to a single line.
 */
export function invoiceItemsForBooking(serviceName: string, notes: string | null | undefined, total: number): BookingInvoiceItems {
  const text = String(notes || "");
  const single: BookingInvoiceItems = { lineItems: [{ id: "detail-service", description: serviceName, quantity: 1, rate: cents(total) }], discountAmount: 0 };
  const base = Number(text.match(/^Base service:\s*\$?([\d.]+)/m)?.[1]);
  if (!Number.isFinite(base) || base < 0) return single;

  const lineItems: BookingInvoiceItems["lineItems"] = [{ id: "detail-service", description: serviceName, quantity: 1, rate: cents(base) }];
  const addOnText = text.match(/^Add-ons:\s*(.*)$/m)?.[1]?.trim() || "None";
  if (addOnText !== "None") {
    const pattern = /(.+?)\s*\(\+\$([\d.]+)\)(?:,\s*|$)/g;
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = pattern.exec(addOnText)) && index < 30) {
      const price = Number(match[2]);
      if (!Number.isFinite(price)) return single;
      lineItems.push({ id: `add-on-${++index}`, description: `Add-on: ${match[1].trim()}`, quantity: 1, rate: cents(price) });
    }
    if (index === 0) return single;
  }

  const subtotal = cents(lineItems.reduce((sum, item) => sum + item.rate, 0));
  const difference = cents(total - subtotal);
  if (difference > 0) lineItems.push({ id: "price-adjustment", description: "Price adjustment", quantity: 1, rate: difference });
  return { lineItems, discountAmount: difference < 0 ? -difference : 0 };
}
