import type { PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { VEHICLE_LABELS } from "@/lib/pricing-config";
import PackageMediaEvidence from "@/components/PackageMediaEvidence";
import type { MediaItem } from "@/lib/media";
import PackageConditionGuide from "@/components/PackageConditionGuide";
import { getPackageConditionGuide } from "@/lib/package-condition-guide";

type Props = {
  config: PricingPageConfig;
  mediaItems?: MediaItem[];
};

function packageBookHref(packageId: string, vehicleClass: VehicleClass) {
  return `/?pricingPage=packages&packageId=${encodeURIComponent(packageId)}&vehicleClass=${encodeURIComponent(vehicleClass)}#book`;
}

export default function HomePackagePricing({ config, mediaItems = [] }: Props) {
  return (
    <section id="prices-packages" className="scroll-mt-28">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7B5C4B]">Detail packages</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#171411] sm:text-4xl">{config.eyebrow}</h3>
        </div>
        <p className="max-w-lg text-sm leading-6 text-[#3F3027]/62">Interior + exterior in one appointment.</p>
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
                  href={packageBookHref(pkg.id, vehicleClass)}
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
              copy={getPackageConditionGuide("packages", pkg.id, pkg.description)}
              packageName={pkg.name}
              media={mediaItems.filter((item) => item.category === `pricing-car-packages-pkg-${pkg.id}-condition`)}
            />
            <PackageMediaEvidence
              packageMedia={mediaItems.filter((item) => item.category === `pricing-car-packages-pkg-${pkg.id}`)}
              featureMedia={pkg.features.map((feature, featureIndex) => ({
                feature,
                items: mediaItems.filter((item) => item.category === `pricing-car-packages-pkg-${pkg.id}-feature-${featureIndex + 1}`),
              }))}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
