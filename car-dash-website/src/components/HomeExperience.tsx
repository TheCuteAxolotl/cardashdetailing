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
    <div className="overflow-hidden bg-[radial-gradient(circle_at_10%_8%,rgba(192,171,154,.38),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(123,92,75,.18),transparent_32%),linear-gradient(180deg,#F7F5F2_0%,#EFE8E2_42%,#F7F5F2_100%)] text-[#171411]">
      <section className="relative px-4 pb-10 pt-7 sm:px-6 sm:pb-14 lg:px-8 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#F7F5F2]/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#C0AB9A]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl pt-16 sm:pt-20 lg:pt-28">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 hidden h-28 rounded-[30px] border border-[#C0AB9A]/38 bg-[#F7F5F2]/94 shadow-[0_22px_70px_rgba(23,20,17,.10)] lg:block" />
          <div className="pointer-events-none absolute left-[5%] right-[5%] top-12 hidden h-32 rounded-[32px] border border-[#C0AB9A]/48 bg-[linear-gradient(110deg,rgba(192,171,154,.92),rgba(123,92,75,.78))] shadow-[0_24px_80px_rgba(23,20,17,.14)] lg:block" />

          <div className="relative min-h-[620px] overflow-hidden rounded-[34px] border border-[#C0AB9A]/38 bg-[#171411] shadow-[0_35px_100px_rgba(23,20,17,.24)] sm:min-h-[680px] lg:min-h-[700px]">
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
                className={`pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(23,20,17,.90)_0%,rgba(63,48,39,.62)_42%,rgba(63,48,39,.18)_72%,rgba(23,20,17,.28)_100%)] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`}
              />
              <div
                className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,20,17,.12),transparent_45%,rgba(23,20,17,.78))] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`}
              />
            </div>

            <div
              className={`absolute left-5 right-5 top-5 z-20 flex items-center justify-between transition-all duration-200 sm:left-7 sm:right-7 sm:top-7 ${heroInteracting ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"}`}
            >
              <div className="flex items-center gap-2 rounded-full border border-[#F7F5F2]/16 bg-[#171411]/28 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#F7F5F2]/82 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#C0AB9A]" />
                {content.heroEyebrow}
              </div>
              <a
                href="/quote"
                className="hidden rounded-full border border-[#F7F5F2]/20 bg-[#F7F5F2]/90 px-4 py-2 text-xs font-semibold text-[#171411] shadow-lg shadow-black/10 backdrop-blur-xl sm:inline-flex"
              >
                Get a custom quote
              </a>
            </div>

            <div
              className={`relative z-10 flex min-h-[620px] flex-col justify-end p-6 transition-all duration-200 sm:min-h-[680px] sm:p-9 lg:min-h-[700px] lg:p-12 ${heroInteracting ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"}`}
            >
              <div className="max-w-3xl">
                <p className="mb-4 text-xs font-medium text-[#F7F5F2]/55 sm:text-sm">Car care that fits around your day.</p>
                <h1 className="max-w-[13ch] text-[clamp(3.35rem,7vw,6.8rem)] font-medium leading-[.86] tracking-[-.07em] text-[#F7F5F2]">
                  {content.heroTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#F7F5F2]/68 sm:text-lg sm:leading-8">
                  {content.heroBody}
                </p>

                <div className="mt-7 flex max-w-3xl flex-wrap gap-2.5">
                  <a href="#prices" className="rounded-full border border-[#F7F5F2]/16 bg-[#F7F5F2]/12 px-5 py-3 text-sm font-medium text-[#F7F5F2] backdrop-blur-xl hover:bg-[#F7F5F2]/18">
                    See prices
                  </a>
                  <a href="#book" className="rounded-full bg-[#F7F5F2] px-5 py-3 text-sm font-semibold text-[#171411] shadow-lg shadow-black/15">
                    Book now
                  </a>
                  <a href="/about" className="rounded-full border border-[#F7F5F2]/16 bg-[#171411]/22 px-5 py-3 text-sm font-medium text-[#F7F5F2]/84 backdrop-blur-xl">
                    Meet Daniel
                  </a>
                </div>
              </div>
            </div>

            <div
              className={`absolute bottom-24 right-7 z-20 hidden w-[280px] overflow-hidden rounded-[24px] border border-[#F7F5F2]/16 bg-[#F7F5F2]/12 p-5 text-[#F7F5F2] shadow-2xl shadow-black/25 backdrop-blur-2xl transition-all duration-200 lg:block ${heroInteracting ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[.17em] text-[#F7F5F2]/58">Mobile service</p>
                <span className="rounded-full bg-[#F7F5F2]/92 px-2.5 py-1 text-[10px] font-semibold text-[#171411]">Local</span>
              </div>
              <p className="mt-8 text-2xl font-medium tracking-[-.035em]">We come to you.</p>
              <p className="mt-2 text-sm leading-6 text-[#F7F5F2]/62">South Elgin and surrounding areas. Pick the service and an open time.</p>
              <a href="#book" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#F7F5F2]">
                Check availability <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[#C0AB9A]/38 bg-[#F7F5F2]/76 p-4 shadow-[0_22px_70px_rgba(23,20,17,.08)] backdrop-blur-2xl sm:p-6">
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
        <div className="mx-auto max-w-7xl rounded-[34px] border border-[#C0AB9A]/42 bg-[#F7F5F2]/82 px-5 py-12 shadow-[0_30px_90px_rgba(23,20,17,.09)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-10 grid gap-6 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7B5C4B]">Pricing</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-medium leading-[.92] tracking-[-.06em] sm:text-6xl">
                See the price first. Then book it.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#3F3027]/66 sm:text-base">
              Full details, interior, exterior, add-ons, and specialty services are all in one place. Choose what fits your vehicle, then go straight to booking.
            </p>
          </div>

          <PageMediaBand categories={["home-services-bg"]} theme="light" compact className="mb-8" />

          <div className="mb-10 flex flex-wrap gap-2">
            <a href="#prices-packages" className="rounded-full bg-[#3F3027] px-4 py-2.5 text-sm font-semibold text-[#F7F5F2]">Full detail</a>
            <a href="#prices-interior" className="rounded-full border border-[#C0AB9A]/42 bg-[#F7F5F2]/88 px-4 py-2.5 text-sm font-medium">Interior</a>
            <a href="#prices-exterior" className="rounded-full border border-[#C0AB9A]/42 bg-[#F7F5F2]/88 px-4 py-2.5 text-sm font-medium">Exterior</a>
            <a href="#extras" className="rounded-full border border-[#C0AB9A]/42 bg-[#F7F5F2]/88 px-4 py-2.5 text-sm font-medium">Add-ons</a>
            <a href="#specialty-prices" className="rounded-full border border-[#C0AB9A]/42 bg-[#F7F5F2]/88 px-4 py-2.5 text-sm font-medium">Specialty</a>
          </div>

          <SimplePricingHub configs={pricingConfigs} bookingPricing={bookingPricing} services={services} mediaItems={pricingMedia} />
        </div>
      </section>

      <section id="book" className="scroll-mt-28 px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[34px] border border-[#C0AB9A]/26 bg-[linear-gradient(135deg,#171411,#3F3027_58%,#7B5C4B)] px-5 py-12 text-[#F7F5F2] shadow-[0_34px_100px_rgba(23,20,17,.24)] sm:px-8 sm:py-16 lg:grid-cols-[.62fr_1.38fr] lg:items-start lg:px-10">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#C0AB9A]">Book</p>
            <h2 className="mt-3 text-4xl font-medium leading-[.95] tracking-[-.055em] sm:text-5xl">Pick your service, day, and time.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#F7F5F2]/58">
              If you tapped a price above, your package is already selected. Fill in the vehicle info, choose an open time, and submit the appointment.
            </p>
            <div className="mt-6 grid gap-2 text-sm text-[#F7F5F2]/68">
              {[
                "Unavailable days are greyed out.",
                "Booked times disappear automatically.",
                "You see the total before submitting.",
                "Opt in for confirmation and appointment texts.",
              ].map((item) => (
                <p key={item} className="flex gap-3 rounded-2xl border border-[#F7F5F2]/10 bg-[#F7F5F2]/5 px-4 py-3">
                  <span className="text-[#C0AB9A]">✓</span>
                  {item}
                </p>
              ))}
            </div>
            <PageMediaBand categories={["home-cta-bg"]} theme="dark" compact className="mt-7" />
          </div>

          <div className="rounded-[28px] border border-[#F7F5F2]/10 bg-[#F7F5F2]/6 p-5 shadow-[0_24px_70px_rgba(23,20,17,.28)] backdrop-blur-xl sm:p-7">
            <BookingForm initialSiteContent={content} />
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-[#C0AB9A]/42 bg-[#F7F5F2]/82 px-5 py-12 shadow-[0_26px_80px_rgba(23,20,17,.08)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7B5C4B]">Recent work</p>
              <h2 className="mt-3 text-4xl font-medium tracking-[-.055em] sm:text-5xl">See the work.</h2>
            </div>
            <a href="/gallery" className="hidden rounded-full border border-[#C0AB9A]/42 bg-[#F7F5F2] px-4 py-2 text-sm font-medium text-[#3F3027]/72 sm:block">Full gallery →</a>
          </div>
          <DynamicGallery limit={6} />
        </div>
      </section>

      <section className="px-4 pb-16 pt-7 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-[#C0AB9A]/42 bg-[#F7F5F2]/76 px-5 py-12 shadow-[0_26px_80px_rgba(23,20,17,.08)] backdrop-blur-2xl sm:px-8 sm:py-16 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7B5C4B]">Google reviews</p>
              <h2 className="mt-3 text-4xl font-medium tracking-[-.055em] sm:text-5xl">What customers say.</h2>
            </div>
            <a href="/reviews" className="text-sm font-medium text-[#3F3027]/68">See all reviews →</a>
          </div>
          <ReviewCards />
        </div>
      </section>
    </div>
  );
}
