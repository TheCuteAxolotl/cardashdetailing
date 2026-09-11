"use client";

import { useEffect, useMemo, useState } from "react";
import PricingMediaStrip from "@/components/PricingMediaStrip";
import SitePhoto from "@/components/SitePhoto";
import { DEFAULT_PRICING_PAGES, PricingPageConfig, VEHICLE_LABELS, VehicleClass, parsePricingConfig } from "@/lib/pricing-config";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

type PageKind = "packages" | "exterior" | "interior";

const contentKeys: Record<PageKind, keyof typeof SITE_DEFAULTS> = {
  packages: "pricingPackagesConfig",
  exterior: "pricingExteriorConfig",
  interior: "pricingInteriorConfig",
};

const slugs: Record<PageKind, string> = {
  packages: "car-packages",
  exterior: "exterior",
  interior: "interior",
};

const pageLabels: Record<PageKind, string> = {
  packages: "Car Detailing Packages",
  exterior: "Exterior Detailing",
  interior: "Interior Detailing",
};

export default function PricingPageExperience({ kind }: { kind: PageKind }) {
  const fallback = DEFAULT_PRICING_PAGES[kind];
  const [config, setConfig] = useState<PricingPageConfig>(fallback);
  const [vehicle, setVehicle] = useState<VehicleClass>("sedan");
  const slug = slugs[kind];

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : SITE_DEFAULTS))
      .then((content) => setConfig(parsePricingConfig(content?.[contentKeys[kind]], fallback)))
      .catch(() => setConfig(fallback));
  }, [kind, fallback]);

  const packageCount = useMemo(() => config.packages.length, [config.packages.length]);

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <SitePhoto category={`pricing-${slug}-hero`} fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,13,13,.97)_0%,rgba(13,13,13,.82)_52%,rgba(13,13,13,.58)_100%)]" />
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">{config.eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[.92] tracking-[-.06em] sm:text-7xl">{config.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">{config.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#pricing" className="rounded-full bg-[#FF2D2D] px-6 py-3 text-sm font-semibold text-[#0D0D0D]">View Packages</a>
            <a href="/quote" className="rounded-full border border-white/15 bg-black/25 px-6 py-3 text-sm font-semibold">Ask a Specialist</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <PricingMediaStrip category={`pricing-${slug}-intro`} />
      </section>

      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-32 px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Our Packages</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Choose the vehicle. See the exact package price.</h2>
          <p className="mt-5 text-white/45">No estimate range on these pages. The selected vehicle class controls the exact package total shown before booking.</p>
        </div>

        <div className="mx-auto mt-9 flex max-w-3xl flex-wrap justify-center gap-2 rounded-[26px] border border-white/10 bg-[#111318] p-3">
          {(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setVehicle(key)}
              className={`min-w-[145px] flex-1 rounded-[20px] border px-5 py-4 text-sm font-semibold transition duration-300 ${vehicle === key ? "border-[#FF2D2D]/55 bg-[#FF2D2D]/10 text-white shadow-[0_0_32px_rgba(255,45,45,.10)]" : "border-white/10 bg-black/15 text-white/55 hover:border-[#FF2D2D]/30 hover:text-white"}`}
            >
              {VEHICLE_LABELS[key]}
            </button>
          ))}
        </div>

        <div className={`mt-12 grid gap-6 ${packageCount >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {config.packages.map((pkg) => {
            const price = Number(pkg.prices?.[vehicle] || 0);
            const bookingHref = `/contact?pricingPage=${encodeURIComponent(kind)}&packageId=${encodeURIComponent(pkg.id)}&vehicleClass=${encodeURIComponent(vehicle)}`;
            return (
              <article key={pkg.id} className={`relative flex min-h-full flex-col overflow-hidden rounded-[32px] border p-6 sm:p-7 ${pkg.featured ? "border-[#FF2D2D]/45 bg-[linear-gradient(180deg,rgba(255,45,45,.07),rgba(74,85,104,.08)_24%,rgba(255,255,255,.02))] shadow-[0_22px_70px_rgba(0,0,0,.32)]" : "border-white/10 bg-[#111318]"}`}>
                {pkg.badge && <span className="absolute right-5 top-5 rounded-full bg-[#FF2D2D] px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-[#0D0D0D]">{pkg.badge}</span>}
                <PricingMediaStrip category={`pricing-${slug}-pkg-${pkg.id}`} className="mb-6" />
                <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#FF2D2D]">{pkg.tier}</p>
                <h3 className="mt-3 pr-20 text-3xl font-semibold tracking-[-.04em]">{pkg.name}</h3>
                <p className="mt-4 min-h-16 text-sm leading-7 text-white/48">{pkg.description}</p>
                <div className="mt-6 border-y border-white/10 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[.22em] text-white/35">Fixed price · {VEHICLE_LABELS[vehicle]}</p>
                  <p className="mt-2 text-5xl font-semibold tracking-[-.05em]"><span className="mr-1 text-2xl text-[#FF2D2D]">$</span>{price.toFixed(0)}</p>
                </div>
                <ul className="mt-6 flex-1 space-y-0">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex gap-3 border-b border-white/[.07] py-3 text-sm leading-6 text-white/68 last:border-b-0">
                      <span className="font-black text-[#FF2D2D]">✓</span><span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a href={bookingHref} className={`mt-7 block rounded-[20px] px-5 py-4 text-center text-sm font-bold transition duration-300 hover:-translate-y-0.5 ${pkg.featured ? "bg-[#FF2D2D] text-[#0D0D0D] shadow-[0_0_30px_rgba(255,45,45,.13)]" : "border border-white/15 bg-white/[.035] text-white hover:border-[#FF2D2D]/35 hover:bg-[#FF2D2D]/8"}`}>
                  {pkg.ctaLabel} →
                </a>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[.025] px-6 py-5 text-sm leading-7 text-white/45">
          <span className="font-semibold text-white/75">Pricing note:</span> {config.priceNote}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111318]/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div><p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Recent Results</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.05em]">Photos can be managed from Owner → Photos & Media.</h2></div>
            <a href="/gallery" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">View Gallery</a>
          </div>
          <PricingMediaStrip category={`pricing-${slug}-results`} className="mt-8" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-[34px] border border-[#FF2D2D]/20 bg-[linear-gradient(130deg,rgba(255,45,45,.08),rgba(74,85,104,.08),rgba(255,255,255,.015))] p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Ready to book?</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Pick the package and your booking carries the exact price with it.</h2>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#pricing" className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D]">Choose a package</a><a href="/quote" className="rounded-full border border-white/15 px-6 py-3 font-semibold">Need something custom?</a></div>
        </div>
      </section>
    </main>
  );
}
