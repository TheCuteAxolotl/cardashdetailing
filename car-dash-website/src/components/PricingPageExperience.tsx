import PricingMediaStrip from "@/components/PricingMediaStrip";
import SitePhoto from "@/components/SitePhoto";
import PageMediaBand from "@/components/PageMediaBand";
import type { PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { VEHICLE_LABELS } from "@/lib/pricing-config";
import PackageMediaEvidence from "@/components/PackageMediaEvidence";
import type { MediaItem } from "@/lib/media";
import PackageConditionGuide from "@/components/PackageConditionGuide";
import { getPackageConditionGuide } from "@/lib/package-condition-guide";

type PageKind = "packages" | "exterior" | "interior";

const pageLabels: Record<PageKind, string> = {
  packages: "Full detail",
  exterior: "Exterior only",
  interior: "Interior only",
};

function bookingHref(kind: PageKind, packageId: string, vehicleClass: VehicleClass) {
  return `/?pricingPage=${encodeURIComponent(kind)}&packageId=${encodeURIComponent(packageId)}&vehicleClass=${encodeURIComponent(vehicleClass)}#book`;
}

export default function PricingPageExperience({ kind, initialConfig: config, mediaItems = [] }: { kind: PageKind; initialConfig: PricingPageConfig; mediaItems?: MediaItem[] }) {
  return (
    <main className="min-h-screen bg-[#f5f4f1] text-[#111]">
      <section className="border-b border-black/[.08] bg-[#f5f4f1] sm:px-5 lg:px-8">
        <div className="public-hero-shell mx-auto grid max-w-[1440px] overflow-hidden sm:my-5 lg:my-7 lg:grid-cols-[.8fr_1.2fr]">
          <div className="flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16">
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-black/38"><span className="h-px w-8 bg-black/20" />{pageLabels[kind]}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl">{config.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-black/50">{config.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#pricing" className="rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white">View pricing</a>
              <a href="/#book" className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold">Book now</a>
              <a href="/quote" className="rounded-md px-2 py-3 text-sm font-semibold text-black/52 hover:text-black">Exact quote →</a>
            </div>
          </div>
          <div className="public-hero-media relative min-h-[380px] bg-[#111] lg:min-h-[610px]">
            <SitePhoto category={`pricing-${kind === "packages" ? "car-packages" : kind}-hero`} fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 pt-10 sm:px-8 sm:pt-12">
        <PricingMediaStrip category={`pricing-${kind === "packages" ? "car-packages" : kind}-intro`} />
      </section>

      <section id="pricing" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-9 flex flex-col gap-3 border-b border-black/[.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/36">Standard pricing</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Choose your vehicle size.</h2>
          </div>
          <a href="/#prices" className="text-sm font-semibold text-black/42 hover:text-black">All services + pricing →</a>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {config.packages.map((pkg) => (
            <article key={pkg.id} className={`package-card relative border border-black/[.08] bg-white p-5 sm:p-6 lg:p-7 ${pkg.featured ? "package-card-featured" : ""}`}>
              <div className="flex min-h-[72px] items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/34">{pkg.tier}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{pkg.name}</h3>
                </div>
                {pkg.badge && <span className="rounded-full bg-[#171411] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.1em] text-white">{pkg.badge}</span>}
              </div>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-black/48">{pkg.description}</p>

              <div className="mt-6 overflow-hidden rounded-xl border border-black/[.08] bg-[#f8f7f4]">
                {(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((vehicleClass, index) => (
                  <a key={vehicleClass} href={bookingHref(kind, pkg.id, vehicleClass)} className={`group flex min-h-14 items-center justify-between gap-4 px-4 py-3 ${index ? "border-t border-black/[.07]" : ""}`}>
                    <span className="text-sm font-medium text-black/50">{VEHICLE_LABELS[vehicleClass]}</span>
                    <span className="flex items-center gap-3"><strong className="text-lg font-semibold">${Number(pkg.prices[vehicleClass] || 0).toFixed(0)}</strong><span className="text-xs font-semibold text-black/34 group-hover:text-black">Book →</span></span>
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

        <div className="pricing-note mt-6 border border-black/[.08] bg-white px-5 py-4 text-sm leading-6 text-black/48"><strong className="text-black/70">Pricing note:</strong> {config.priceNote}</div>
      </section>

      <PageMediaBand categories={[`pricing-${kind === "packages" ? "car-packages" : kind}-results`]} theme="light" className="mx-auto max-w-[1320px] px-5 pb-14 sm:px-8 sm:pb-18" />

      <section className="border-t border-white/10 bg-[#111] text-white">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/34">Ready to book?</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Choose the service and pick an open time.</h2></div>
          <div className="flex gap-3"><a href="/#book" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111]">Book now</a><a href="/quote" className="rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-white/72">Exact quote</a></div>
        </div>
      </section>
    </main>
  );
}
