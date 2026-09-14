import PricingMediaStrip from "@/components/PricingMediaStrip";
import SitePhoto from "@/components/SitePhoto";
import PageMediaBand from "@/components/PageMediaBand";
import type { PricingPageConfig, VehicleClass } from "@/lib/pricing-config";
import { VEHICLE_LABELS } from "@/lib/pricing-config";
import PackageMediaEvidence from "@/components/PackageMediaEvidence";
import type { MediaItem } from "@/lib/media";

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
    <main className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-3 lg:py-8">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">{pageLabels[kind]}</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">{config.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/52">{config.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#pricing" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">See prices</a>
              <a href="/#book" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-bold text-white">Book now</a>
              <a href="/quote" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Exact quote</a>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[380px]">
            <SitePhoto category={`pricing-${kind === "packages" ? "car-packages" : kind}-hero`} fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-10">
        <PricingMediaStrip category={`pricing-${kind === "packages" ? "car-packages" : kind}-intro`} />
      </section>

      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Standard prices</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Pick your vehicle size.</h2>
          </div>
          <a href="/#prices" className="text-sm font-semibold text-black/45">See every service + price →</a>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {config.packages.map((pkg) => (
            <article key={pkg.id} className={`rounded-[26px] border p-5 sm:p-6 ${pkg.featured ? "border-[#FF2D2D]/35 bg-[#fff8f7] shadow-[0_18px_50px_rgba(0,0,0,.07)]" : "border-black/10 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#FF2D2D]">{pkg.tier}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{pkg.name}</h3>
                </div>
                {pkg.badge && <span className="rounded-full bg-[#FF2D2D] px-3 py-1.5 text-[10px] font-bold text-white">{pkg.badge}</span>}
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-black/48">{pkg.description}</p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-[#F7F7F5]">
                {(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((vehicleClass, index) => (
                  <a key={vehicleClass} href={bookingHref(kind, pkg.id, vehicleClass)} className={`flex min-h-14 items-center justify-between gap-4 px-4 py-3 hover:bg-white ${index ? "border-t border-black/8" : ""}`}>
                    <span className="text-sm font-medium text-black/60">{VEHICLE_LABELS[vehicleClass]}</span>
                    <span className="flex items-center gap-3"><strong className="text-lg">${Number(pkg.prices[vehicleClass] || 0).toFixed(0)}</strong><span className="text-xs font-semibold text-[#FF2D2D]">Book →</span></span>
                  </a>
                ))}
              </div>

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

        <div className="mt-6 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm leading-6 text-black/50"><strong className="text-black/75">Pricing note:</strong> {config.priceNote}</div>
      </section>

      <PageMediaBand categories={[`pricing-${kind === "packages" ? "car-packages" : kind}-results`]} theme="light" className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16" />

      <section className="border-t border-black/8 bg-[#111] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Ready?</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Choose a price and book an open time.</h2></div>
          <div className="flex gap-3"><a href="/#book" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-bold">Book now</a><a href="/quote" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">Exact quote</a></div>
        </div>
      </section>
    </main>
  );
}
