"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site-defaults";
import type { PricingPageConfig } from "@/lib/pricing-config";
import DynamicGallery from "@/components/DynamicGallery";
import ReviewCards from "@/components/ReviewCards";
import BookingForm from "@/components/BookingForm";
import HomePackagePricing from "@/components/HomePackagePricing";
import type { MediaItem } from "@/lib/media";
import PageMediaBand from "@/components/PageMediaBand";
import Hero360Viewer from "@/components/Hero360Viewer";
import SitePhoto from "@/components/SitePhoto";

type Props = {
  initialContent: SiteContent;
  pricingConfig: PricingPageConfig;
  pricingMedia?: MediaItem[];
  hero360Frames?: MediaItem[];
};

export default function HomeExperience({
  initialContent: content,
  pricingConfig,
  pricingMedia = [],
  hero360Frames = [],
}: Props) {
  const [heroInteracting, setHeroInteracting] = useState(false);

  return (
    <div className="bg-[#f5f4f1] text-[#111]">
      <section className="px-0 sm:px-5 sm:pt-5 lg:px-8 lg:pt-7">
        <div className="home-hero-shell relative mx-auto min-h-[680px] max-w-[1440px] overflow-hidden bg-[#111] sm:min-h-[740px] lg:min-h-[780px]">
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
            <div className={`home-hero-side-gradient pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.84)_0%,rgba(0,0,0,.56)_38%,rgba(0,0,0,.18)_72%,rgba(0,0,0,.08)_100%)] transition-opacity duration-300 ${heroInteracting ? "opacity-0" : "opacity-100"}`} />
            <div className={`home-hero-bottom-gradient pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.18),transparent_38%,rgba(0,0,0,.7))] transition-opacity duration-300 ${heroInteracting ? "opacity-0" : "opacity-100"}`} />
          </div>

          <div className={`home-hero-content relative z-10 flex min-h-[680px] flex-col justify-between px-5 py-7 transition-opacity duration-300 sm:min-h-[740px] sm:px-9 sm:py-9 lg:min-h-[780px] lg:px-14 lg:py-12 ${heroInteracting ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <div className="flex items-start justify-between gap-5 text-white">
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/64"><span className="h-px w-8 bg-white/35" />{content.heroEyebrow}</p>
              <a href="/quote" className="hidden rounded-full border border-white/24 bg-black/15 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white hover:text-black sm:inline-flex">Get an exact quote <span className="ml-2">↗</span></a>
            </div>

            <div className="home-hero-copy max-w-[900px] pb-5 text-white sm:pb-9">
              <p className="mb-5 text-sm font-medium tracking-[.01em] text-white/62">We come to you. No shop drop-off.</p>
              <h1 className="max-w-[12ch] text-[clamp(3.55rem,7.8vw,7.8rem)] font-semibold leading-[.84] tracking-[-.075em]">
                {content.heroTitle}
              </h1>
              <p className="mt-7 max-w-[650px] text-sm leading-7 text-white/68 sm:text-base sm:leading-8">{content.heroBody}</p>
              <div className="home-hero-actions mt-8 flex flex-wrap gap-3">
                <a href="#book" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111] shadow-[0_12px_32px_rgba(0,0,0,.12)] hover:bg-[#ece9e3]">Book a detail</a>
                <a href="#prices" className="rounded-full border border-white/24 bg-black/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/8">View pricing</a>
              </div>
            </div>
          </div>
          {hero360Frames.length > 1 && !heroInteracting && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/16 bg-black/25 px-3 py-2 text-[9px] font-medium uppercase tracking-[.14em] text-white/62 backdrop-blur-md sm:bottom-5 sm:right-5 sm:text-[10px]">
              <span className="text-base leading-none">↔</span><span className="sm:hidden">Swipe</span><span className="hidden sm:inline">Drag to explore</span>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-black/[.08] bg-white py-1">
        <div className="home-proof-grid mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-black/[.07] border-x border-black/[.07] sm:grid-cols-4 sm:divide-y-0">
          {[
            ["01", "Mobile service", "We come to your home or work."],
            ["02", "Clear pricing", "You’ll see the price before you book."],
            ["03", "Paint correction", "We match the correction to what your paint actually needs."],
            ["04", "Protection that lasts", "Ceramic coating and maintenance options when you want them."],
          ].map(([number, title, body]) => (
            <div key={number} className="home-proof-card min-h-[148px] p-5 sm:p-6 lg:p-7">
              <p className="text-[10px] font-semibold tracking-[.12em] text-black/28">{number}</p>
              <p className="mt-5 text-sm font-semibold tracking-[-.01em] text-[#111]">{title}</p>
              <p className="mt-1.5 max-w-[220px] text-xs leading-5 text-black/42">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f5f4f1] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">Recent work</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">See what we’ve been working on.</h2>
            </div>
            <div className="flex items-end justify-between gap-5">
              <p className="max-w-xl text-sm leading-7 text-black/48">Interiors, exterior details, paint correction, coatings — real jobs we’ve finished for customers.</p>
              <a href="/gallery" className="hidden shrink-0 text-sm font-semibold text-black/55 hover:text-black sm:block">View full gallery →</a>
            </div>
          </div>
          <div className="home-gallery mt-10"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section id="prices" className="scroll-mt-24 border-y border-black/[.08] bg-white px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-10 grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">Pricing</p>
              <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Simple packages. You’ll know the price before you book.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-black/48">Choose your vehicle size and the level of detail you want. If it needs paint correction, a coating, heavy cleanup, or something out of the ordinary, send us a few photos and we’ll quote it exactly.</p>
          </div>
          <HomePackagePricing config={pricingConfig} mediaItems={pricingMedia} />
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/[.08] pt-6 text-sm font-medium text-black/52">
            <a href="/interior-detailing" className="hover:text-black">Interior only →</a>
            <a href="/exterior-detailing" className="hover:text-black">Exterior only →</a>
            <a href="/paint-correction" className="hover:text-black">Paint correction →</a>
            <a href="/ceramic-coatings" className="hover:text-black">Ceramic coating →</a>
          </div>
        </div>
      </section>

      <section id="book" className="scroll-mt-24 bg-[#111] px-5 py-16 text-white sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/35">Booking</p>
            <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Pick the service. Pick a time. We’ll take it from there.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/48">Tell us what you drive, what you want done, and when works for you. We’ll review it and reach out if we need to confirm anything.</p>
            <div className="mt-8 border-y border-white/10">
              {[
                "Dates that are already booked won’t show up.",
                "You’ll see your total before you submit.",
                "We can text you appointment updates.",
              ].map((item) => (
                <p key={item} className="border-b border-white/10 py-4 text-sm text-white/55 last:border-b-0">{item}</p>
              ))}
            </div>
            <PageMediaBand categories={["home-cta-bg"]} theme="dark" compact className="mt-8" />
          </div>

          <div className="booking-shell border border-white/12 bg-[#181818] p-4 shadow-[0_28px_80px_rgba(0,0,0,.18)] sm:p-6 lg:p-7">
            <BookingForm initialSiteContent={content} />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f4f1] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-9 flex items-end justify-between gap-5 border-b border-black/[.08] pb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">Customer feedback</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">See what customers are saying.</h2>
            </div>
            <a href="/reviews" className="hidden text-sm font-semibold text-black/50 hover:text-black sm:block">All reviews →</a>
          </div>
          <ReviewCards />
        </div>
      </section>
    </div>
  );
}
