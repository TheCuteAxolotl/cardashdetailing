export type DetailBuilderVehicleClass = "sedan" | "suv" | "truck";

export type DetailBuilderCatalogItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  prices: Record<DetailBuilderVehicleClass, number>;
  active: boolean;
  unitLabel?: string;
};

export type DetailBuilderCatalog = {
  version: number;
  items: DetailBuilderCatalogItem[];
};

export const DETAIL_BUILDER_VEHICLE_LABELS: Record<DetailBuilderVehicleClass, string> = {
  sedan: "Sedan",
  suv: "SUV / CRV",
  truck: "Truck / 3-Row SUV",
};

export const DETAIL_BUILDER_CATEGORIES = [
  "Job setup",
  "Interior",
  "Exterior",
  "Condition add-ons",
  "Paint & protection",
] as const;

export const DEFAULT_DETAIL_BUILDER_CATALOG: DetailBuilderCatalog = {
  version: 1,
  items: [
    { id: "mobile-setup", name: "Mobile service setup", category: "Job setup", description: "Travel/setup allowance for a custom à-la-carte job.", prices: { sedan: 25, suv: 30, truck: 35 }, active: true },

    { id: "interior-vacuum", name: "Full interior vacuum", category: "Interior", description: "Seats, floors and accessible cabin areas.", prices: { sedan: 30, suv: 35, truck: 40 }, active: true },
    { id: "crevices-tracks", name: "Cracks, crevices & seat tracks", category: "Interior", description: "Detail brushes, air/blowout and tight-area cleanup.", prices: { sedan: 15, suv: 20, truck: 25 }, active: true },
    { id: "dash-console", name: "Dash, console & cup holders", category: "Interior", description: "Clean common hard surfaces and touch points.", prices: { sedan: 25, suv: 30, truck: 35 }, active: true },
    { id: "door-panels", name: "Door panels & pockets", category: "Interior", description: "Clean door plastics, handles and storage pockets.", prices: { sedan: 15, suv: 18, truck: 22 }, active: true },
    { id: "vents-controls", name: "Air vents & controls", category: "Interior", description: "Detail vents, buttons and small trim areas.", prices: { sedan: 10, suv: 12, truck: 15 }, active: true },
    { id: "interior-glass", name: "Interior glass", category: "Interior", description: "Windshield, side glass and mirrors inside.", prices: { sedan: 12, suv: 15, truck: 18 }, active: true },
    { id: "floor-mats", name: "Floor mats", category: "Interior", description: "Vacuum and clean carpet/rubber floor mats.", prices: { sedan: 15, suv: 20, truck: 25 }, active: true },
    { id: "seat-cleaning", name: "Seat surface cleaning", category: "Interior", description: "Clean seat surfaces without extraction.", prices: { sedan: 20, suv: 25, truck: 30 }, active: true },
    { id: "under-seats", name: "Under-seat detail", category: "Interior", description: "Extra work beneath seats and seat rails.", prices: { sedan: 10, suv: 15, truck: 20 }, active: true },
    { id: "cargo-area", name: "Trunk / cargo area", category: "Interior", description: "Vacuum and clean the cargo area.", prices: { sedan: 12, suv: 15, truck: 20 }, active: true },
    { id: "carpet-deep-clean", name: "Carpet deep clean", category: "Interior", description: "Agitation and deeper carpet cleaning.", prices: { sedan: 30, suv: 40, truck: 50 }, active: true },
    { id: "light-stain", name: "Light stain treatment", category: "Interior", description: "Targeted treatment for ordinary light staining.", prices: { sedan: 15, suv: 20, truck: 25 }, active: true },
    { id: "interior-disinfect", name: "Interior surface disinfecting", category: "Interior", description: "Disinfect compatible high-touch surfaces.", prices: { sedan: 10, suv: 12, truck: 15 }, active: true },

    { id: "pre-rinse", name: "Pre-rinse", category: "Exterior", description: "Initial rinse to remove loose contamination.", prices: { sedan: 8, suv: 10, truck: 12 }, active: true },
    { id: "foam-pre-soak", name: "Foam pre-soak", category: "Exterior", description: "Foam application and dwell before contact wash.", prices: { sedan: 12, suv: 15, truck: 18 }, active: true },
    { id: "hand-wash", name: "Hand contact wash", category: "Exterior", description: "Safe hand wash of painted exterior surfaces.", prices: { sedan: 30, suv: 35, truck: 40 }, active: true },
    { id: "wheels-tires", name: "Wheels & tires", category: "Exterior", description: "Clean wheel faces/barrels as accessible and tires.", prices: { sedan: 25, suv: 30, truck: 35 }, active: true },
    { id: "exterior-glass", name: "Exterior glass", category: "Exterior", description: "Exterior windshield, windows and mirrors.", prices: { sedan: 10, suv: 12, truck: 15 }, active: true },
    { id: "dry-finish", name: "Hand / blow dry", category: "Exterior", description: "Dry exterior and finish edges/crevices.", prices: { sedan: 12, suv: 15, truck: 18 }, active: true },
    { id: "tire-dressing", name: "Tire dressing", category: "Exterior", description: "Finish tires after cleaning.", prices: { sedan: 8, suv: 10, truck: 12 }, active: true },
    { id: "bug-removal", name: "Bug removal", category: "Exterior", description: "Targeted bug removal on front-facing surfaces.", prices: { sedan: 10, suv: 15, truck: 20 }, active: true },
    { id: "spray-protection", name: "Spray sealant / gloss protection", category: "Exterior", description: "Short-term paint protection and gloss finish.", prices: { sedan: 20, suv: 25, truck: 30 }, active: true },
    { id: "door-jambs", name: "Door jambs", category: "Exterior", description: "Wipe and clean accessible door jambs.", prices: { sedan: 10, suv: 15, truck: 20 }, active: true },

    { id: "pet-hair-light", name: "Light pet hair removal", category: "Condition add-ons", description: "Light pet hair beyond a normal vacuum.", prices: { sedan: 25, suv: 35, truck: 45 }, active: true },
    { id: "pet-hair-heavy", name: "Heavy pet hair removal", category: "Condition add-ons", description: "Extended pet-hair removal for embedded/heavy hair.", prices: { sedan: 55, suv: 75, truck: 95 }, active: true },
    { id: "seat-shampoo", name: "Seat shampoo / extraction", category: "Condition add-ons", description: "Shampoo/extract cloth seating as needed.", prices: { sedan: 35, suv: 45, truck: 55 }, active: true, unitLabel: "section" },
    { id: "carpet-extraction", name: "Carpet extraction", category: "Condition add-ons", description: "Extraction for heavily soiled carpet areas.", prices: { sedan: 40, suv: 50, truck: 60 }, active: true },
    { id: "odor-treatment", name: "Odor-focused treatment", category: "Condition add-ons", description: "Extra cleaning time focused on odor sources.", prices: { sedan: 30, suv: 40, truck: 50 }, active: true },
    { id: "adhesive-removal", name: "Sticker / adhesive removal", category: "Condition add-ons", description: "Light adhesive or sticker residue removal.", prices: { sedan: 20, suv: 30, truck: 40 }, active: true },
    { id: "heavy-stain", name: "Heavy stain treatment", category: "Condition add-ons", description: "Extended treatment for heavier staining.", prices: { sedan: 30, suv: 40, truck: 50 }, active: true },

    { id: "iron-decon", name: "Iron decontamination", category: "Paint & protection", description: "Chemical iron/fallout removal.", prices: { sedan: 30, suv: 40, truck: 50 }, active: true },
    { id: "clay-treatment", name: "Clay treatment", category: "Paint & protection", description: "Mechanical bonded-contaminant removal.", prices: { sedan: 35, suv: 45, truck: 55 }, active: true },
    { id: "ceramic-sealant", name: "Ceramic sealant", category: "Paint & protection", description: "Premium spray sealant after proper exterior prep.", prices: { sedan: 35, suv: 45, truck: 55 }, active: true },
    { id: "engine-bay", name: "Engine bay detail", category: "Paint & protection", description: "Careful engine-bay cleaning and finishing.", prices: { sedan: 40, suv: 50, truck: 60 }, active: true },
    { id: "paint-enhancement", name: "One-step paint enhancement", category: "Paint & protection", description: "Single-stage machine polish for gloss and light defect reduction.", prices: { sedan: 149, suv: 199, truck: 249 }, active: true },
    { id: "headlight-restoration", name: "Headlight restoration", category: "Paint & protection", description: "Restore oxidized headlight lenses; priced per pair.", prices: { sedan: 99, suv: 99, truck: 99 }, active: true },
  ],
};

function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100) / 100) : 0;
}

function cleanString(value: unknown, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

export function sanitizeDetailBuilderCatalog(value: unknown): DetailBuilderCatalog {
  const input = typeof value === "object" && value ? value as Partial<DetailBuilderCatalog> : {};
  const items = Array.isArray(input.items) ? input.items : DEFAULT_DETAIL_BUILDER_CATALOG.items;
  const cleaned = items.slice(0, 100).map((raw, index) => {
    const item = raw as Partial<DetailBuilderCatalogItem>;
    const prices = item.prices || { sedan: 0, suv: 0, truck: 0 };
    return {
      id: cleanString(item.id, 80) || `item-${index + 1}`,
      name: cleanString(item.name, 120) || `Service ${index + 1}`,
      category: cleanString(item.category, 80) || "Other",
      description: cleanString(item.description, 260),
      prices: {
        sedan: money(prices.sedan),
        suv: money(prices.suv),
        truck: money(prices.truck),
      },
      active: item.active !== false,
      unitLabel: cleanString(item.unitLabel, 40) || undefined,
    } satisfies DetailBuilderCatalogItem;
  });

  return { version: 1, items: cleaned };
}

export function parseDetailBuilderCatalog(value: string | null | undefined): DetailBuilderCatalog {
  if (!value) return DEFAULT_DETAIL_BUILDER_CATALOG;
  try {
    return sanitizeDetailBuilderCatalog(JSON.parse(value));
  } catch {
    return DEFAULT_DETAIL_BUILDER_CATALOG;
  }
}
