import type { PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { VEHICLE_LABELS } from "@/lib/pricing-config";
import type { BookingPricingConfig } from "@/lib/booking-pricing";
import PackageMediaEvidence from "@/components/PackageMediaEvidence";
import type { MediaItem } from "@/lib/media";
import ServiceMediaEvidence from "@/components/ServiceMediaEvidence";
import PackageConditionGuide from "@/components/PackageConditionGuide";
import { getPackageConditionGuide } from "@/lib/package-condition-guide";

export type PublicServiceSummary = {
  id: string;
  title: string;
  description: string;
  price: number;
  startingPrice: number | null;
  maxPrice: number | null;
  pricingType: string;
  category: string;
  subcategory: string;
};

type PricingKind = "packages" | "interior" | "exterior";

type Props = {
  configs: Record<PricingKind, PricingPageConfig>;
  bookingPricing: BookingPricingConfig;
  services: PublicServiceSummary[];
  mediaItems?: MediaItem[];
};

const groups: Array<{ kind: PricingKind; label: string; description: string }> = [
  { kind: "packages", label: "Full detail", description: "Interior + exterior in one appointment." },
  { kind: "interior", label: "Interior only", description: "From a light cleanup to a deeper reset." },
  { kind: "exterior", label: "Exterior only", description: "Wash, decontamination, protection, and paint enhancement." },
];

function servicePrice(service: PublicServiceSummary) {
  if (service.pricingType === "fixed" && service.price > 0) return `$${service.price.toFixed(0)}`;
  if (service.pricingType === "starting") return `From $${Number(service.startingPrice ?? service.price).toFixed(0)}`;
  if (service.pricingType === "range") {
    const low = Number(service.startingPrice ?? service.price);
    const high = Number(service.maxPrice ?? service.startingPrice ?? service.price);
    return low && high ? `$${low.toFixed(0)}–$${high.toFixed(0)}` : "Exact quote";
  }
  return "Exact quote";
}

function packageBookHref(kind: PricingKind, packageId: string, vehicleClass: VehicleClass) {
  return `/?pricingPage=${encodeURIComponent(kind)}&packageId=${encodeURIComponent(packageId)}&vehicleClass=${encodeURIComponent(vehicleClass)}#book`;
}

export default function SimplePricingHub({ configs, bookingPricing, services, mediaItems = [] }: Props) {
  const specialty = services.filter((service) => service.title.trim().toLowerCase() !== "headlight restoration");
  const addOns = bookingPricing.addOns.filter((item) => item.active);

  return (
    <div className="space-y-14">
      {groups.map(({ kind, label, description }) => {
        const config = configs[kind];
        return (
          <section key={kind} id={`prices-${kind}`} className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7B5C4B]">{label}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#171411] sm:text-4xl">{config.eyebrow}</h3>
              </div>
              <p className="max-w-lg text-sm leading-6 text-[#3F3027]/62">{description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {config.packages.map((pkg) => (
                <article key={pkg.id} className={`rounded-[26px] border p-5 sm:p-6 ${pkg.featured ? "border-[#C0AB9A]/55 bg-[#EFE8E2] shadow-[0_18px_50px_rgba(23,20,17,.08)]" : "border-[#C0AB9A]/35 bg-[#F7F5F2]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7B5C4B]">{pkg.tier}</p>
                      <h4 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-[#171411]">{pkg.name}</h4>
                    </div>
                    {pkg.badge && <span className="rounded-full bg-[#C0AB9A] px-3 py-1.5 text-[10px] font-bold text-[#171411]">{pkg.badge}</span>}
                  </div>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-[#3F3027]/62">{pkg.description}</p>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-[#C0AB9A]/35 bg-[#EFE8E2]">
                    {(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((vehicleClass, index) => (
                      <a
                        key={vehicleClass}
                        href={packageBookHref(kind, pkg.id, vehicleClass)}
                        className={`flex min-h-14 items-center justify-between gap-4 px-4 py-3 hover:bg-[#F7F5F2] ${index ? "border-t border-[#C0AB9A]/28" : ""}`}
                      >
                        <span className="text-sm font-medium text-[#3F3027]/70">{VEHICLE_LABELS[vehicleClass]}</span>
                        <span className="flex items-center gap-3">
                          <strong className="text-lg text-[#171411]">${Number(pkg.prices[vehicleClass] || 0).toFixed(0)}</strong>
                          <span className="text-xs font-semibold text-[#7B5C4B]">Book →</span>
                        </span>
                      </a>
                    ))}
                  </div>

                  <PackageConditionGuide
                    copy={getPackageConditionGuide(kind, pkg.id, pkg.description)}
                    packageName={pkg.name}
                    media={mediaItems.filter((item) => item.category === `pricing-${kind === "packages" ? "car-packages" : kind}-pkg-${pkg.id}-condition`)}
                  />

                  <PackageMediaEvidence
                    packageMedia={mediaItems.filter((item) => item.category === `pricing-${kind === "packages" ? "car-packages" : kind}-pkg-${pkg.id}`)}
                    featureMedia={pkg.features.map((feature, featureIndex) => ({
                      feature,
                      items: mediaItems.filter((item) => item.category === `pricing-${kind === "packages" ? "car-packages" : kind}-pkg-${pkg.id}-feature-${featureIndex + 1}`),
                    }))}
                  />
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section id="extras" className="scroll-mt-28 rounded-[28px] border border-[#C0AB9A]/35 bg-[linear-gradient(135deg,#3F3027,#171411)] p-6 text-[#F7F5F2] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#C0AB9A]">Add-ons</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Extras and their prices.</h3>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#F7F5F2]/55">Add-ons can be selected while booking. Headlight restoration is ${bookingPricing.headlightStandalonePrice.toFixed(0)} by itself.</p>
        </div>
        <div className="mt-6 grid overflow-hidden rounded-2xl border border-[#F7F5F2]/12 bg-[#F7F5F2]/4 sm:grid-cols-2 lg:grid-cols-3">
          {addOns.map((item, index) => (
            <div key={item.id} className={`flex items-center justify-between gap-4 px-4 py-3.5 ${index ? "border-t border-[#F7F5F2]/10 sm:border-t-0" : ""} sm:border-r sm:border-[#F7F5F2]/10`}>
              <span className="text-sm text-[#F7F5F2]/68">{item.name}</span>
              <strong className="text-sm text-[#F7F5F2]">+${item.price.toFixed(0)}</strong>
            </div>
          ))}
        </div>
      </section>

      {specialty.length > 0 && (
        <section id="specialty-prices" className="scroll-mt-28">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7B5C4B]">Specialty services</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#171411] sm:text-4xl">Paint, ceramic, marine, and other services.</h3>
          </div>
          <div className="overflow-hidden rounded-[26px] border border-[#C0AB9A]/35 bg-[#F7F5F2]">
            {specialty.map((service, index) => {
              const canBook = service.pricingType === "fixed" && service.price > 0;
              const href = canBook ? `/?service=${encodeURIComponent(service.id)}#book` : `/quote?service=${encodeURIComponent(service.id)}`;
              return (
                <div key={service.id} className={`grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6 ${index ? "border-t border-[#C0AB9A]/28" : ""}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-[#171411]">{service.title}</h4>
                      <span className="rounded-full bg-[#EFE8E2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#3F3027]/62">{service.category}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-[#3F3027]/60">{service.description}</p>
                    <div className="mt-3">
                      <ServiceMediaEvidence items={mediaItems.filter((item) => item.category === `service-${service.id}`)} />
                    </div>
                  </div>
                  <strong className="text-xl text-[#171411]">{servicePrice(service)}</strong>
                  <a href={href} className={`rounded-full px-4 py-2.5 text-center text-xs font-bold ${canBook ? "bg-[#3F3027] text-[#F7F5F2]" : "border border-[#7B5C4B]/35 text-[#3F3027]"}`}>{canBook ? "Book" : "Get quote"}</a>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
