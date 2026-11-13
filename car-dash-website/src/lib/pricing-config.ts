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
    title: "Pick the detail that fits your car.",
    body: "Choose your vehicle size, compare what’s included, and pick the level your car actually needs.",
    priceNote: "These prices cover normal vehicle conditions. If there’s extreme pet hair, biohazards, heavy stains, lots of adhesive, or restoration work, we’ll quote that separately before we start.",
    packages: [
      {
        id: "essential",
        tier: "Essential",
        name: "Essential Detail",
        description: "Meticulous interior vacuuming, detailed surface care, a hand wash, wheel and tire cleaning, glass detailing, and a refined exterior gloss finish.",
        ctaLabel: "Book Essential Detail",
        prices: { coupe: 149, sedan: 179, truckSuv: 189 },
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
        description: "Everything in Essential, elevated with deeper cabin and crevice detailing, carpet and mat cleaning, light stain treatment, and protective exterior finishing.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Detail",
        prices: { coupe: 209, sedan: 239, truckSuv: 269 },
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
        description: "Everything in Full Detail, refined with iron and clay decontamination, one-step machine polishing, and premium ceramic sealant protection.",
        ctaLabel: "Book Signature Detail",
        prices: { coupe: 389, sedan: 439, truckSuv: 489 },
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
    title: "From a maintenance wash to a full paint enhancement.",
    body: "Choose your vehicle size, then pick how far you want to take the exterior.",
    priceNote: "These prices cover the listed work for your vehicle size. Heavy tar, overspray, oxidation, sanding, or extra correction will need a separate quote.",
    packages: [
      {
        id: "maintenance-wash",
        tier: "Entry",
        name: "Maintenance Wash",
        description: "A careful foam and hand wash with wheel and tire care, bug removal, crystal-clear exterior glass, and a finished tire dressing.",
        ctaLabel: "Book Maintenance Wash",
        prices: { coupe: 69, sedan: 79, truckSuv: 99 },
        features: ["Pre-rinse", "Foam cannon wash", "Contact hand wash", "Wheel faces and tires", "Bug removal", "Exterior glass", "Tire dressing"],
      },
      {
        id: "full-exterior",
        tier: "Best Value",
        name: "Full Exterior Detail",
        description: "Everything in Maintenance Wash, enhanced with iron decontamination, light clay treatment as needed, and a protective paint sealant.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Exterior Detail",
        prices: { coupe: 139, sedan: 159, truckSuv: 189 },
        features: ["Everything in Maintenance Wash", "Inner wheel cleaning", "Door jamb wipe-down", "Iron decontamination", "Light clay treatment as needed", "Paint sealant", "Trim and tire finish"],
      },
      {
        id: "paint-enhancement",
        tier: "Premium",
        name: "Paint Enhancement Detail",
        description: "Complete exterior decontamination followed by single-stage machine polishing, light swirl reduction, and a protective sealant finish.",
        ctaLabel: "Book Paint Enhancement",
        prices: { coupe: 289, sedan: 339, truckSuv: 439 },
        features: ["Full exterior decontamination", "Clay treatment", "Single-stage machine polishing", "Gloss enhancement", "Light swirl reduction", "Paint sealant", "Final paint inspection"],
      },
    ],
  },
  interior: {
    eyebrow: "Interior Detailing",
    title: "From a quick interior refresh to a deep clean.",
    body: "Choose your vehicle size, then pick how much cleaning the interior actually needs.",
    priceNote: "These prices cover normal conditions for your vehicle size. Extreme pet hair, mold, biohazards, heavy contamination, or lots of personal-item removal will need a custom quote.",
    packages: [
      {
        id: "interior-refresh",
        tier: "Entry",
        name: "Interior Refresh",
        description: "Full cabin vacuuming, detailed dashboard and console care, cupholder and touch-point cleaning, interior glass, crevices, and floor mats.",
        ctaLabel: "Book Interior Refresh",
        prices: { coupe: 109, sedan: 119, truckSuv: 149 },
        features: ["Full vacuum", "Dash and console wipe-down", "Cupholders and touch points", "Interior glass", "Light crevice cleaning", "Floor mats", "Final interior check"],
      },
      {
        id: "full-interior",
        tier: "Best Value",
        name: "Full Interior Detail",
        description: "Everything in Interior Refresh, with detailed seat, carpet, and mat cleaning, vent and door-panel detailing, and protection on compatible surfaces.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Full Interior Detail",
        prices: { coupe: 169, sedan: 189, truckSuv: 229 },
        features: ["Everything in Interior Refresh", "Detailed brushing", "Seat cleaning", "Carpet and mat cleaning", "Door panels and jambs", "Vent detailing", "Interior protection on compatible surfaces"],
      },
      {
        id: "deep-reset",
        tier: "Deep Clean",
        name: "Deep Interior Reset",
        description: "Everything in Full Interior Detail, plus carpet extraction, seat shampoo where applicable, heavier stain treatment, and odor-focused cleaning.",
        ctaLabel: "Book Deep Interior Reset",
        prices: { coupe: 239, sedan: 269, truckSuv: 319 },
        features: ["Everything in Full Interior", "Carpet extraction", "Seat shampoo as applicable", "Heavier stain treatment", "Deep crevice work", "Odor-focused cleaning", "Extended detail time"],
      },
    ],
  },
};

/** Applies one flat dollar reduction to every positive vehicle price in a saved
 * page configuration. Never changes package content, IDs, add-ons or discounts. */
export function reducePackagePrices(config: PricingPageConfig, amount: number): PricingPageConfig {
  if (!Number.isFinite(amount) || amount <= 0) return config;
  return {
    ...config,
    packages: config.packages.map(pkg => ({
      ...pkg,
      prices: Object.fromEntries(
        (Object.keys(VEHICLE_LABELS) as VehicleClass[]).map(vehicle => {
          const original = Number(pkg.prices?.[vehicle]);
          return [vehicle, Number.isFinite(original) && original > 0
            ? Math.max(0, Math.round((original - amount) * 100) / 100)
            : original];
        })
      ) as Record<VehicleClass, number>,
    })),
  };
}

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
