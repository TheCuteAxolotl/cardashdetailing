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
      <section className="px-0 sm:px-5 lg:px-8">
        <div className="relative mx-auto min-h-[650px] max-w-[1440px] overflow-hidden bg-[#111] sm:min-h-[720px]">
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
            <div className={`pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.82)_0%,rgba(0,0,0,.52)_42%,rgba(0,0,0,.14)_78%,rgba(0,0,0,.12)_100%)] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`} />
            <div className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),transparent_45%,rgba(0,0,0,.58))] transition-opacity duration-200 ${heroInteracting ? "opacity-0" : "opacity-100"}`} />
          </div>

          <div className={`relative z-10 flex min-h-[650px] flex-col justify-between px-5 py-7 transition-opacity duration-200 sm:min-h-[720px] sm:px-8 sm:py-9 lg:px-12 lg:py-11 ${heroInteracting ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <div className="flex items-start justify-between gap-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/62">{content.heroEyebrow}</p>
              <a href="/quote" className="hidden rounded-md border border-white/30 bg-black/15 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white hover:text-black sm:inline-flex">Get an exact quote</a>
            </div>

            <div className="max-w-[830px] pb-4 text-white sm:pb-8">
              <p className="mb-5 text-sm font-medium text-white/58">We come to you. No shop drop-off.</p>
              <h1 className="max-w-[12ch] text-[clamp(3.4rem,7.5vw,7.5rem)] font-semibold leading-[.86] tracking-[-.072em]">
                {content.heroTitle}
              </h1>
              <p className="mt-7 max-w-2xl text-sm leading-7 text-white/66 sm:text-base sm:leading-8">{content.heroBody}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#book" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#111] hover:bg-[#ece9e3]">Book a detail</a>
                <a href="#prices" className="rounded-md border border-white/28 px-5 py-3 text-sm font-medium text-white hover:border-white/60">View pricing</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/[.08] bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-black/[.07] border-x border-black/[.07] sm:grid-cols-4 sm:divide-y-0">
          {[
            ["01", "Mobile service", "We come to your home or work."],
            ["02", "Clear pricing", "You’ll see the price before you book."],
            ["03", "Paint correction", "We match the correction to what your paint actually needs."],
            ["04", "Protection that lasts", "Ceramic coating and maintenance options when you want them."],
          ].map(([number, title, body]) => (
            <div key={number} className="min-h-[138px] p-5 sm:p-6 lg:p-7">
              <p className="text-[10px] font-semibold tracking-[.12em] text-black/28">{number}</p>
              <p className="mt-5 text-sm font-semibold text-[#111]">{title}</p>
              <p className="mt-1.5 max-w-[220px] text-xs leading-5 text-black/42">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f5f4f1] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
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
          <div className="mt-9"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section id="prices" className="scroll-mt-24 border-y border-black/[.08] bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
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

      <section id="book" className="scroll-mt-24 bg-[#111] px-5 py-16 text-white sm:px-8 sm:py-20 lg:py-24">
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

          <div className="border border-white/12 bg-[#181818] p-4 sm:p-6 lg:p-7">
            <BookingForm initialSiteContent={content} />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f4f1] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
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
