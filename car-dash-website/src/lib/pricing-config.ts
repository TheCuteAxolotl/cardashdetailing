export type VehicleClass = "coupe" | "sedan" | "truckSuv";

export type PricingPackage = {
  id: string;
  tier: string;
  name: string;
  description: string;
  badge?: string;
  featured?: boolean;
  ctaLabel: string;
  prices: Record<VehicleClass, number>;
  features: string[];
};

export type PricingPageConfig = {
  eyebrow: string;
  title: string;
  body: string;
  priceNote: string;
  packages: PricingPackage[];
};

// Keep the existing internal keys for backward compatibility with saved pricing data,
// but present the vehicle sizes customers actually choose on the current menu.
export const VEHICLE_LABELS: Record<VehicleClass, string> = {
  coupe: "Sedan",
  sedan: "SUV/CRV",
  truckSuv: "Truck/3 Row SUV",
};

export const DEFAULT_PRICING_PAGES: Record<"packages" | "exterior" | "interior", PricingPageConfig> = {
  packages: {
    eyebrow: "Car Detailing Packages",
    title: "Choose the detail your vehicle needs.",
    body: "Three straightforward inside-and-out packages. Choose your vehicle size, compare what is included, and book the level that matches its condition.",
    priceNote: "Standard pricing covers normal vehicle conditions. Extreme pet hair, biohazards, excessive adhesive or sticker removal, severe staining, or unusual restoration work is quoted separately before service begins.",
    packages: [
      {
        id: "essential",
        tier: "Essential",
        name: "Essential Detail",
        description: "A complete maintenance-style interior and exterior detail for vehicles that are already kept up fairly well.",
        ctaLabel: "Book Essential Detail",
        prices: { coupe: 159, sedan: 189, truckSuv: 199 },
        features: [
          "Full interior vacuum",
          "Seats, dash, console, door panels and cup holders cleaned",
          "Cracks and crevices cleaned",
          "Floor mats cleaned",
          "Interior and exterior glass",
          "Pre-rinse and foam wash",
          "Hand contact wash",
          "Wheels and tires cleaned",
          "Tire dressing",
          "Hand dry and exterior finishing gloss",
        ],
      },
      {
        id: "complete",
        tier: "Full Detail",
        name: "Full Detail",
        description: "A deeper interior and exterior reset for everyday buildup, kids, crumbs, moderate mess, and vehicles that need more attention.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Detail",
        prices: { coupe: 219, sedan: 249, truckSuv: 279 },
        features: [
          "Everything in Essential",
          "Thorough interior vacuum and deeper crevice work",
          "Seats and under-seat areas detailed",
          "Dashboard, console, cup holders and door pockets detailed",
          "Carpet and floor mats deep cleaned",
          "Light stain treatment",
          "Interior surfaces disinfected",
          "Air vents detailed",
          "Trunk or cargo area vacuumed",
          "Moderate crumbs and kid mess cleaned",
          "Light sticker or adhesive removal when possible",
          "Two-stage foam and contact wash",
          "Bug removal, spray protection and gloss finish",
        ],
      },
      {
        id: "signature",
        tier: "Signature",
        name: "Signature Detail",
        description: "Our most complete detail: a full interior and exterior reset plus paint decontamination and a one-step machine polish for more gloss and clarity.",
        ctaLabel: "Book Signature Detail",
        prices: { coupe: 399, sedan: 449, truckSuv: 499 },
        features: [
          "Everything in Full Detail",
          "Iron decontamination",
          "Clay-bar treatment",
          "One-step machine paint enhancement",
          "Gloss and clarity enhancement",
          "Light swirl, haze and oxidation reduction",
          "Panel wipe and final paint inspection",
          "Premium ceramic sealant protection",
        ],
      },
    ],
  },
  exterior: {
    eyebrow: "Exterior Detailing",
    title: "Exterior detailing from a maintenance wash to paint enhancement.",
    body: "Choose your vehicle size, then pick anything from a maintenance wash to a full exterior detail or paint enhancement.",
    priceNote: "Prices shown are fixed for the selected vehicle class. Severe tar, overspray, oxidation, sanding, or correction beyond the listed package is quoted separately.",
    packages: [
      {
        id: "maintenance-wash",
        tier: "Entry",
        name: "Maintenance Wash",
        description: "A maintenance wash for vehicles that are already in good condition.",
        ctaLabel: "Book Maintenance Wash",
        prices: { coupe: 79, sedan: 89, truckSuv: 109 },
        features: ["Pre-rinse", "Foam cannon wash", "Contact hand wash", "Wheel faces and tires", "Bug removal", "Exterior glass", "Tire dressing"],
      },
      {
        id: "full-exterior",
        tier: "Best Value",
        name: "Full Exterior Detail",
        description: "A deeper exterior clean with decontamination and paint protection.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Exterior Detail",
        prices: { coupe: 149, sedan: 169, truckSuv: 199 },
        features: ["Everything in Maintenance Wash", "Inner wheel cleaning", "Door jamb wipe-down", "Iron decontamination", "Light clay treatment as needed", "Paint sealant", "Trim and tire finish"],
      },
      {
        id: "paint-enhancement",
        tier: "Premium",
        name: "Paint Enhancement Detail",
        description: "Full exterior prep plus a one-step machine polish for more gloss and clarity.",
        ctaLabel: "Book Paint Enhancement",
        prices: { coupe: 299, sedan: 349, truckSuv: 449 },
        features: ["Full exterior decontamination", "Clay treatment", "Single-stage machine polishing", "Gloss enhancement", "Light swirl reduction", "Paint sealant", "Final paint inspection"],
      },
    ],
  },
  interior: {
    eyebrow: "Interior Detailing",
    title: "Interior detailing from a quick refresh to a deep clean.",
    body: "Choose your vehicle size and how much cleaning the interior needs.",
    priceNote: "Prices shown are fixed for the selected vehicle class. Extreme pet hair, mold, biohazards, heavy bodily-fluid contamination, or excessive personal-item removal require a custom quote.",
    packages: [
      {
        id: "interior-refresh",
        tier: "Entry",
        name: "Interior Refresh",
        description: "A lighter clean for interiors that are already kept up pretty well.",
        ctaLabel: "Book Interior Refresh",
        prices: { coupe: 119, sedan: 129, truckSuv: 159 },
        features: ["Full vacuum", "Dash and console wipe-down", "Cupholders and touch points", "Interior glass", "Light crevice cleaning", "Floor mats", "Final interior check"],
      },
      {
        id: "full-interior",
        tier: "Best Value",
        name: "Full Interior Detail",
        description: "A full interior detail when the cabin needs more than a quick cleanup.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Interior Detail",
        prices: { coupe: 179, sedan: 199, truckSuv: 239 },
        features: ["Everything in Interior Refresh", "Detailed brushing", "Seat cleaning", "Carpet and mat cleaning", "Door panels and jambs", "Vent detailing", "Interior protection on compatible surfaces"],
      },
      {
        id: "deep-reset",
        tier: "Deep Clean",
        name: "Deep Interior Reset",
        description: "A deeper clean for stains, neglected interiors, and heavier buildup.",
        ctaLabel: "Book Deep Interior Reset",
        prices: { coupe: 249, sedan: 279, truckSuv: 329 },
        features: ["Everything in Full Interior", "Carpet extraction", "Seat shampoo as applicable", "Heavier stain treatment", "Deep crevice work", "Odor-focused cleaning", "Extended detail time"],
      },
    ],
  },
};

function shouldMigrateLegacyPackageMenu(parsed: PricingPageConfig, fallback: PricingPageConfig) {
  if (fallback !== DEFAULT_PRICING_PAGES.packages) return false;
  const ids = new Set(parsed.packages.map((item) => item.id));
  const essential = parsed.packages.find((item) => item.id === "essential");
  const complete = parsed.packages.find((item) => item.id === "complete");
  const currentTwoPackageMenu =
    parsed.packages.length === 2 &&
    ids.has("essential") &&
    ids.has("complete") &&
    essential?.name === "Essential Detail" &&
    complete?.name === "Full Detail" &&
    essential.prices?.coupe === 159 &&
    essential.prices?.sedan === 189 &&
    essential.prices?.truckSuv === 199 &&
    complete.prices?.coupe === 219 &&
    complete.prices?.sedan === 249 &&
    complete.prices?.truckSuv === 279;

  return currentTwoPackageMenu || complete?.name === "Complete Detail";
}

export function parsePricingConfig(value: string | null | undefined, fallback: PricingPageConfig): PricingPageConfig {
  try {
    const parsed = JSON.parse(value || "") as PricingPageConfig;
    if (!parsed || !Array.isArray(parsed.packages)) return fallback;
    if (shouldMigrateLegacyPackageMenu(parsed, fallback)) return DEFAULT_PRICING_PAGES.packages;
    return parsed;
  } catch {
    return fallback;
  }
}

export function getPackagePrice(config: PricingPageConfig, packageId: string, vehicleClass: string) {
  const pkg = config.packages.find((item) => item.id === packageId);
  if (!pkg) return null;
  if (!(vehicleClass in VEHICLE_LABELS)) return null;
  const key = vehicleClass as VehicleClass;
  const price = Number(pkg.prices?.[key]);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { pkg, key, price };
}
