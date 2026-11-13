"use client";
import SitePhoto from "@/components/SitePhoto";
import type { PricingPackage, PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS } from "@/lib/pricing-config";

export type BookingCategory = "packages" | "interior" | "exterior" | "other";
type OtherService = { id: string; title: string; price: number; pricingType: string };
type Props = {
  category: BookingCategory;
  onCategoryChange: (category: BookingCategory) => void;
  configs: Record<"packages" | "interior" | "exterior", PricingPageConfig>;
  vehicleClass: VehicleClass;
  selected: string;
  onSelect: (value: string) => void;
  otherServices: OtherService[];
  standaloneId: string;
  headlightPrice: number;
};
const kinds = [
  { id: "packages", title: "Full car", description: "Inside + outside" },
  { id: "interior", title: "Interior", description: "Inside only" },
  { id: "exterior", title: "Exterior", description: "Outside only" },
  { id: "other", title: "Other", description: "Specialty services" },
] as const;

/** Concise, owner-safe highlights: use polished copy only while the original
 * package inclusions match; otherwise show the owner's live feature list. */
const premiumHighlights: Record<string, string[]> = {
  "packages:essential": [
    "Meticulous interior vacuuming & surface detailing",
    "Gentle hand wash, wheel & tire care",
    "Crystal-clear glass & gloss-enhancing finish",
  ],
  "packages:complete": [
    "Everything included in the Essential Detail",
    "Deep carpet, mat & interior crevice care",
    "Light stain treatment & protective exterior finish",
  ],
  "packages:signature": [
    "Everything included in the Full Detail",
    "Iron removal & clay-bar paint decontamination",
    "One-step machine polish & premium ceramic sealant",
  ],
  "interior:interior-refresh": [
    "Complete cabin vacuum & floor mat cleaning",
    "Dashboard, console & touch-point detailing",
    "Interior glass & fine crevice cleaning",
  ],
  "interior:full-interior": [
    "Everything included in the Interior Refresh",
    "Detailed seat, carpet & floor mat cleaning",
    "Vent, door-panel & compatible surface protection",
  ],
  "interior:deep-reset": [
    "Everything included in the Full Interior Detail",
    "Carpet extraction & seat shampoo where applicable",
    "Heavy stain care & odor-focused interior cleaning",
  ],
  "exterior:maintenance-wash": [
    "Foam pre-wash & careful contact hand wash",
    "Wheel, tire & light bug removal",
    "Exterior glass detailing & tire finish",
  ],
  "exterior:full-exterior": [
    "Everything included in the Maintenance Wash",
    "Iron removal & light clay treatment as needed",
    "Paint sealant, trim & wheel finishing",
  ],
  "exterior:paint-enhancement": [
    "Exterior decontamination & clay treatment",
    "Single-stage machine polishing for enhanced gloss",
    "Light swirl reduction & paint sealant protection",
  ],
};

function includedHighlights(kind: Exclude<BookingCategory, "other">, pkg: PricingPackage): string[] {
  const current = Array.isArray(pkg.features) ? pkg.features.filter((item) => typeof item === "string" && item.trim()) : [];
  const baseline = DEFAULT_PRICING_PAGES[kind].packages.find((item) => item.id === pkg.id);
  const curated = premiumHighlights[`${kind}:${pkg.id}`];
  // A customized package must reflect the owner's current inclusions, not cached marketing copy.
  if (baseline && curated && JSON.stringify(current) === JSON.stringify(baseline.features)) return curated;
  return current.slice(0, 3);
}

export default function BookingServiceCatalog({
  category,onCategoryChange,configs,vehicleClass,selected,onSelect,
  otherServices,standaloneId,headlightPrice,
}: Props) {
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Choose what you need cleaned">
      {kinds.map(item => <button key={item.id} type="button" onClick={() => onCategoryChange(item.id)}
        aria-pressed={category === item.id}
        className={"min-h-[82px] rounded-xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b779] " +
          (category === item.id ? "border-[#d6b779] bg-[#d6b779] text-[#171717]" : "border-white/15 bg-[#252525] text-[#ded6ca] hover:border-[#d6b779]/60")}>
          <span className="block text-sm font-bold">{item.title}</span>
          <span className={"mt-1 block text-xs " + (category === item.id ? "text-[#171717]/70" : "text-white/50")}>{item.description}</span>
        </button>)}
    </div>
    <p className="text-sm font-medium text-white/80">Choose the package that looks right for your car.</p>
    {category === "other" ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {[{id:standaloneId,title:"Headlight Restoration",price:headlightPrice,pricingType:"fixed"},...otherServices].map(service => {
          const checked = selected === "service:" + service.id;
          return <button key={service.id} type="button" onClick={() => onSelect("service:" + service.id)}
            aria-pressed={checked} className={"rounded-2xl border p-4 text-left transition " +
              (checked ? "border-[#d6b779] bg-[#302b21]" : "border-white/15 bg-[#222] hover:border-[#d6b779]/50")}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-[#f4efe5]">{service.title}</p>
              {checked && <span className="text-xs font-semibold text-[#e5c995]">Selected</span>}
            </div>
            <p className="mt-3 text-sm font-semibold text-[#e5c995]">{service.pricingType === "fixed" && service.price > 0 ? "$" + service.price.toFixed(0) : "Custom quote required"}</p>
          </button>;
        })}
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {configs[category].packages.map(pkg => {
          const id = "package:" + category + ":" + pkg.id;
          const checked = selected === id;
          const price = Number(pkg.prices[vehicleClass] || 0);
          const highlights = includedHighlights(category, pkg);
          return <button key={id} type="button" onClick={() => onSelect(id)} aria-pressed={checked}
            className={"group overflow-hidden rounded-2xl border text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779] " +
              (checked ? "border-[#d6b779] bg-[#302b21] ring-1 ring-[#d6b779]/30" : "border-white/15 bg-[#212121] hover:border-[#d6b779]/60")}>
            <div className="relative aspect-[16/9] overflow-hidden bg-[#272624]">
              <SitePhoto category={(category === "packages" ? "pricing-car-packages-pkg-" : "pricing-" + category + "-pkg-") + pkg.id}
                fallbackCategory={"pricing-" + (category === "packages" ? "car-packages" : category) + "-hero"}
                className="h-full w-full" alt={pkg.name + " detailing photo"} />
              {pkg.badge && <span className="absolute left-2.5 top-2.5 rounded-full bg-[#d6b779] px-2.5 py-1 text-[10px] font-bold text-[#151515]">{pkg.badge}</span>}
              {checked && <span className="absolute bottom-2.5 right-2.5 rounded-full bg-[#d6b779] px-3 py-1 text-[10px] font-bold text-[#151515]">Selected</span>}
            </div>
            <div className="p-3.5">
              <p className="min-h-[40px] text-sm font-semibold leading-5 text-[#f4efe5]">{pkg.name}</p>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#e5c995]">Your detail includes</p>
                {highlights.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {highlights.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-[12px] leading-5 text-[#e4ded4]">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#d6b779]" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-[#c7beb2]">{pkg.description}</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <span className="text-[10px] text-[#ada599]">{VEHICLE_LABELS[vehicleClass]}</span>
                <strong className="text-base tabular-nums text-[#e5c995]">{"$" + price.toFixed(0)}</strong>
              </div>
            </div>
          </button>;
        })}
      </div>
    )}
    <p className="text-xs leading-5 text-[#ada69c]">Photos are from Car Dash's gallery where available. Pricing updates with vehicle size and options.</p>
  </div>;
}
