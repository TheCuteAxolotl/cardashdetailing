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
    <section id="prices-packages" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/36">Detail packages</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-[#111] sm:text-3xl">{config.eyebrow}</h3>
        </div>
        <p className="max-w-lg text-sm leading-6 text-black/42">Interior and exterior in one appointment.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {config.packages.map((pkg) => (
          <article key={pkg.id} className={`package-card relative border border-black/[.08] bg-white p-5 sm:p-6 lg:p-7 ${pkg.featured ? "package-card-featured" : ""}`}>
            <div className="flex min-h-[72px] items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/34">{pkg.tier}</p>
                <h4 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-[#111]">{pkg.name}</h4>
              </div>
              {pkg.badge && <span className="rounded-full bg-[#171411] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.1em] text-white">{pkg.badge}</span>}
            </div>

            <p className="mt-3 min-h-[72px] text-sm leading-6 text-black/48">{pkg.description}</p>

            <div className="mt-6 overflow-hidden rounded-xl border border-black/[.08] bg-[#f8f7f4]">
              {(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((vehicleClass, index) => (
                <a
                  key={vehicleClass}
                  href={packageBookHref(pkg.id, vehicleClass)}
                  className={`group flex min-h-14 items-center justify-between gap-4 px-4 py-3 ${index ? "border-t border-black/[.07]" : ""}`}
                >
                  <span className="text-sm font-medium text-black/50">{VEHICLE_LABELS[vehicleClass]}</span>
                  <span className="flex items-center gap-3">
                    <strong className="text-lg font-semibold text-[#111]">${Number(pkg.prices[vehicleClass] || 0).toFixed(0)}</strong>
                    <span className="text-xs font-semibold text-black/36 transition group-hover:translate-x-0.5 group-hover:text-black">Book →</span>
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
