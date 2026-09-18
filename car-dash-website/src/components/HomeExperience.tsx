"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site-defaults";
import type { PricingPageConfig } from "@/lib/pricing-config";
import type { BookingPricingConfig } from "@/lib/booking-pricing";
import DynamicGallery from "@/components/DynamicGallery";
import ReviewCards from "@/components/ReviewCards";
import BookingForm from "@/components/BookingForm";
import SimplePricingHub, { type PublicServiceSummary } from "@/components/SimplePricingHub";
import type { MediaItem } from "@/lib/media";
import PageMediaBand from "@/components/PageMediaBand";
import Hero360Viewer from "@/components/Hero360Viewer";
import SitePhoto from "@/components/SitePhoto";

type PricingKind = "packages" | "interior" | "exterior";

type Props = {
  initialContent: SiteContent;
  pricingConfigs: Record<PricingKind, PricingPageConfig>;
  bookingPricing: BookingPricingConfig;
  services: PublicServiceSummary[];
  pricingMedia?: MediaItem[];
  hero360Frames?: MediaItem[];
};

export default function HomeExperience({
  initialContent: content,
  pricingConfigs,
  bookingPricing,
  services,
  pricingMedia = [],
  hero360Frames = [],
}: Props) {
  const [heroInteracting, setHeroInteracting] = useState(false);

  return (
    <div className="overflow-hidden bg-[radial-gradient(circle_at_10%_8%,rgba(168,233,226,.72),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(150,205,255,.62),transparent_32%),linear-gradient(180deg,#edf8f5_0%,#f6f7f4_34%,#f3f1ed_100%)] text-[#111]">
      <section className="relative px-4 pb-10 pt-7 sm:px-6 sm:pb-14 lg:px-8 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-white/55 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#acdfff]/45 blur-3xl" />

        <div className="relative mx-auto max-w-7xl pt-16 sm:pt-20 lg:pt-28">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 hidden h-28 rounded-[30px] border border-white/75 bg-[#f8f4ed]/90 shadow-[0_22px_70px_rgba(56,91,91,.10)] lg:block" />
          <div className="pointer-events-none absolute left-[5%] right-[5%] top-12 hidden h-32 rounded-[32px] border border-white/65 bg-[linear-gradient(110deg,rgba(82,142,199,.88),rgba(114,189,218,.82))] shadow-[0_24px_80px_rgba(42,96,125,.14)] lg:block" />

          <div className="relative min-h-[620px] overflow-hidden rounded-[34px] border border-white/70 bg-[#0c1b27] shadow-[0_35px_100px_rgba(45,89,96,.24)] sm:min-h-[680px] lg:min-h-[700px]">
            <div className="absolute inset-0">
              {hero360Frames.length > 0 ? (
                <Hero360Viewer
                  frames={hero360Frames}
                  className="absolute inset-0 h-full w-full"
                  onInteractionChange={setHeroInteracting}
                />
              ) : (
                <SitePhoto
                  category="hero"
                  fallbackCategory="home-showcase-primary"
                  className="absolute inset-0 h-full w-full object-cover"
                  alt="Car Dash Detailing"
                />
              )}
              <div
                className={`pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,14,22,.88)_0%,rgba(5,14,22,.58)_42%,rgba(5,14,22,.18)_72%,rgba(5,14,22,.25)_100%)] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`}
              />
              <div
                className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,15,.10),transparent_45%,rgba(2,9,15,.72))] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`}
              />
            </div>

            <div
              className={`absolute left-5 right-5 top-5 z-20 flex items-center justify-between transition-all duration-200 sm:left-7 sm:right-7 sm:top-7 ${heroInteracting ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"}`}
            >
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/80 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#FF2D2D]" />
                {content.heroEyebrow}
              </div>
              <a
                href="/quote"
                className="hidden rounded-full border border-white/20 bg-white/88 px-4 py-2 text-xs font-semibold text-[#111] shadow-lg shadow-black/10 backdrop-blur-xl sm:inline-flex"
              >
                Get a custom quote
              </a>
            </div>

            <div
              className={`relative z-10 flex min-h-[620px] flex-col justify-end p-6 transition-all duration-200 sm:min-h-[680px] sm:p-9 lg:min-h-[700px] lg:p-12 ${heroInteracting ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"}`}
            >
              <div className="max-w-3xl">
                <p className="mb-4 text-xs font-medium text-white/52 sm:text-sm">Car care that fits around your day.</p>
                <h1 className="max-w-[13ch] text-[clamp(3.35rem,7vw,6.8rem)] font-medium leading-[.86] tracking-[-.07em] text-white">
                  {content.heroTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-white/64 sm:text-lg sm:leading-8">
                  {content.heroBody}
                </p>

                <div className="mt-7 flex max-w-3xl flex-wrap gap-2.5">
                  <a href="#prices" className="rounded-full border border-white/15 bg-white/12 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl hover:bg-white/18">
                    See prices
                  </a>
                  <a href="#book" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#101820] shadow-lg shadow-black/15">
                    Book now
                  </a>
                  <a href="/about" className="rounded-full border border-white/15 bg-black/18 px-5 py-3 text-sm font-medium text-white/82 backdrop-blur-xl">
                    Meet Daniel
                  </a>
                </div>
              </div>
            </div>

            <div
              className={`absolute bottom-7 right-7 z-20 hidden w-[280px] overflow-hidden rounded-[24px] border border-white/16 bg-white/12 p-5 text-white shadow-2xl shadow-black/25 backdrop-blur-2xl transition-all duration-200 lg:block ${heroInteracting ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[.17em] text-white/55">Mobile service</p>
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#111]">Local</span>
              </div>
              <p className="mt-8 text-2xl font-medium tracking-[-.035em]">We come to you.</p>
              <p className="mt-2 text-sm leading-6 text-white/58">South Elgin and surrounding areas. Pick the service and an open time.</p>
              <a href="#book" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                Check availability <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-white/70 bg-white/62 p-4 shadow-[0_22px_70px_rgba(50,80,80,.08)] backdrop-blur-2xl sm:p-6">
          <PageMediaBand
            categories={["home-showcase-primary", "home-showcase-secondary", "home-story"]}
            theme="light"
            eyebrow="A quick look"
            title="Real work from Car Dash."
            className="px-1 py-3 sm:px-2 sm:py-5"
          />
        </div>
      </section>

      <section id="prices" className="scroll-mt-28 px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-white/75 bg-white/70 px-5 py-12 shadow-[0_30px_90px_rgba(54,80,80,.09)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-10 grid gap-6 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-black/40">Pricing</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-medium leading-[.92] tracking-[-.06em] sm:text-6xl">
                See the price first. Then book it.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-black/52 sm:text-base">
              Full details, interior, exterior, add-ons, and specialty services are all in one place. Choose what fits your vehicle, then go straight to booking.
            </p>
          </div>

          <PageMediaBand categories={["home-services-bg"]} theme="light" compact className="mb-8" />

          <div className="mb-10 flex flex-wrap gap-2">
            <a href="#prices-packages" className="rounded-full bg-[#111] px-4 py-2.5 text-sm font-semibold text-white">Full detail</a>
            <a href="#prices-interior" className="rounded-full border border-black/8 bg-white/80 px-4 py-2.5 text-sm font-medium">Interior</a>
            <a href="#prices-exterior" className="rounded-full border border-black/8 bg-white/80 px-4 py-2.5 text-sm font-medium">Exterior</a>
            <a href="#extras" className="rounded-full border border-black/8 bg-white/80 px-4 py-2.5 text-sm font-medium">Add-ons</a>
            <a href="#specialty-prices" className="rounded-full border border-black/8 bg-white/80 px-4 py-2.5 text-sm font-medium">Specialty</a>
          </div>

          <SimplePricingHub configs={pricingConfigs} bookingPricing={bookingPricing} services={services} mediaItems={pricingMedia} />
        </div>
      </section>

      <section id="book" className="scroll-mt-28 px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,#0b1822,#121b24_58%,#171314)] px-5 py-12 text-white shadow-[0_34px_100px_rgba(18,29,37,.24)] sm:px-8 sm:py-16 lg:grid-cols-[.62fr_1.38fr] lg:items-start lg:px-10">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-white/40">Book</p>
            <h2 className="mt-3 text-4xl font-medium leading-[.95] tracking-[-.055em] sm:text-5xl">Pick your service, day, and time.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
              If you tapped a price above, your package is already selected. Fill in the vehicle info, choose an open time, and submit the appointment.
            </p>
            <div className="mt-6 grid gap-2 text-sm text-white/60">
              {[
                "Unavailable days are greyed out.",
                "Booked times disappear automatically.",
                "You see the total before submitting.",
                "Opt in for confirmation and appointment texts.",
              ].map((item) => (
                <p key={item} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3">
                  <span className="text-[#FF5B5B]">✓</span>
                  {item}
                </p>
              ))}
            </div>
            <PageMediaBand categories={["home-cta-bg"]} theme="dark" compact className="mt-7" />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,.24)] backdrop-blur-xl sm:p-7">
            <BookingForm initialSiteContent={content} />
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-white/75 bg-white/72 px-5 py-12 shadow-[0_26px_80px_rgba(54,80,80,.08)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-black/40">Recent work</p>
              <h2 className="mt-3 text-4xl font-medium tracking-[-.055em] sm:text-5xl">See the work.</h2>
            </div>
            <a href="/gallery" className="hidden rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-black/55 sm:block">Full gallery →</a>
          </div>
          <DynamicGallery limit={6} />
        </div>
      </section>

      <section className="px-4 pb-16 pt-7 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-white/75 bg-white/60 px-5 py-12 shadow-[0_26px_80px_rgba(54,80,80,.08)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-black/40">Google reviews</p>
              <h2 className="mt-3 text-4xl font-medium tracking-[-.055em] sm:text-5xl">What customers say.</h2>
            </div>
            <a href="/reviews" className="text-sm font-medium text-black/50">See all reviews →</a>
          </div>
          <ReviewCards />
        </div>
      </section>
    </div>
  );
}
