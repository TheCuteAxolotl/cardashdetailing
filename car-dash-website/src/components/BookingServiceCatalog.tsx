"use client";
import SitePhoto from "@/components/SitePhoto";
import type { PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { VEHICLE_LABELS } from "@/lib/pricing-config";

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
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#b4aca1]">{pkg.description}</p>
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
