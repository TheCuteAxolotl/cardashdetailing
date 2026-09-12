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

export const VEHICLE_LABELS: Record<VehicleClass, string> = {
  coupe: "Coupe",
  sedan: "Sedan",
  truckSuv: "Truck & SUV",
};

export const DEFAULT_PRICING_PAGES: Record<"packages" | "exterior" | "interior", PricingPageConfig> = {
  packages: {
    eyebrow: "Car Detailing Packages",
    title: "Complete detailing packages with a clear price before you book.",
    body: "Pick your vehicle type, compare what is included, and book the package that matches the level of reset you want.",
    priceNote: "Prices shown are fixed for the selected vehicle class. Extreme pet hair, biohazards, or unusual restoration work are quoted separately before service begins.",
    packages: [
      {
        id: "essential",
        tier: "Essential",
        name: "Essential Detail",
        description: "A straightforward inside-and-out reset for a regularly maintained vehicle.",
        ctaLabel: "Book Essential Detail",
        prices: { coupe: 159, sedan: 179, truckSuv: 219 },
        features: ["Foam hand wash", "Wheels and tires", "Interior vacuum", "Interior wipe-down", "Glass inside and out", "Crevices and touch points", "Tire dressing"],
      },
      {
        id: "complete",
        tier: "Best Value",
        name: "Complete Detail",
        description: "A deeper full-vehicle detail with added decontamination and protection.",
        badge: "Most Popular",
        featured: true,
        ctaLabel: "Book Complete Detail",
        prices: { coupe: 219, sedan: 249, truckSuv: 299 },
        features: ["Everything in Essential", "Interior disinfecting", "Vent and detail brushing", "Iron decontamination", "Contact wash", "Spray sealant protection", "Door jambs"],
      },
      {
        id: "signature",
        tier: "Signature",
        name: "Signature Detail",
        description: "The full reset plus a light machine paint enhancement for extra gloss and clarity.",
        ctaLabel: "Reserve Signature Detail",
        prices: { coupe: 399, sedan: 449, truckSuv: 529 },
        features: ["Everything in Complete", "Clay decontamination as needed", "Single-stage paint enhancement", "Gloss refinement", "Hand-applied protection", "Exterior trim finish", "Final paint inspection"],
      },
    ],
  },
  exterior: {
    eyebrow: "Exterior Detailing",
    title: "Exterior packages built around the finish you want.",
    body: "Choose the vehicle type first, then select a fixed-price exterior service from maintenance washing through paint enhancement.",
    priceNote: "Prices shown are fixed for the selected vehicle class. Severe tar, overspray, oxidation, sanding, or correction beyond the listed package is quoted separately.",
    packages: [
      {
        id: "maintenance-wash",
        tier: "Entry",
        name: "Maintenance Wash",
        description: "A safe exterior refresh for vehicles that are already in good condition.",
        ctaLabel: "Book Maintenance Wash",
        prices: { coupe: 79, sedan: 89, truckSuv: 109 },
        features: ["Pre-rinse", "Foam cannon wash", "Contact hand wash", "Wheel faces and tires", "Bug removal", "Exterior glass", "Tire dressing"],
      },
      {
        id: "full-exterior",
        tier: "Best Value",
        name: "Full Exterior Detail",
        description: "A deeper exterior clean with chemical decontamination and paint protection.",
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
        description: "Exterior decontamination plus a single-stage machine enhancement for added gloss and clarity.",
        ctaLabel: "Reserve Paint Enhancement",
        prices: { coupe: 299, sedan: 349, truckSuv: 449 },
        features: ["Full exterior decontamination", "Clay treatment", "Single-stage machine polishing", "Gloss enhancement", "Light swirl reduction", "Paint sealant", "Final paint inspection"],
      },
    ],
  },
  interior: {
    eyebrow: "Interior Detailing",
    title: "Interior packages from a clean refresh to a deep reset.",
    body: "Choose the vehicle type, compare the level of cleaning, and book with the exact package price shown.",
    priceNote: "Prices shown are fixed for the selected vehicle class. Extreme pet hair, mold, biohazards, heavy bodily-fluid contamination, or excessive personal-item removal require a custom quote.",
    packages: [
      {
        id: "interior-refresh",
        tier: "Entry",
        name: "Interior Refresh",
        description: "A clean-up for regularly maintained interiors that need the basics handled well.",
        ctaLabel: "Book Interior Refresh",
        prices: { coupe: 119, sedan: 129, truckSuv: 159 },
        features: ["Full vacuum", "Dash and console wipe-down", "Cupholders and touch points", "Interior glass", "Light crevice cleaning", "Floor mats", "Final interior check"],
      },
      {
        id: "full-interior",
        tier: "Best Value",
        name: "Full Interior Detail",
        description: "A thorough interior detail for vehicles that need more than a maintenance clean.",
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
        description: "A more intensive reset for neglected interiors, stains, and heavier buildup.",
        ctaLabel: "Reserve Deep Interior Reset",
        prices: { coupe: 249, sedan: 279, truckSuv: 329 },
        features: ["Everything in Full Interior", "Carpet extraction", "Seat shampoo as applicable", "Heavier stain treatment", "Deep crevice work", "Odor-focused cleaning", "Extended detail time"],
      },
    ],
  },
};

export function parsePricingConfig(value: string | null | undefined, fallback: PricingPageConfig): PricingPageConfig {
  try {
    const parsed = JSON.parse(value || "") as PricingPageConfig;
    if (!parsed || !Array.isArray(parsed.packages)) return fallback;
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
