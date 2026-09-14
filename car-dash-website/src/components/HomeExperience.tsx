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

 type PricingKind = "packages" | "interior" | "exterior";

type Props = {
  initialContent: SiteContent;
  pricingConfigs: Record<PricingKind, PricingPageConfig>;
  bookingPricing: BookingPricingConfig;
  services: PublicServiceSummary[];
  pricingMedia?: MediaItem[];
  hero360Frames?: MediaItem[];
};

export default function HomeExperience({ initialContent: content, pricingConfigs, bookingPricing, services, pricingMedia = [], hero360Frames = [] }: Props) {
  return (
    <div className="bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-[#0D0D0D] text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[.92fr_1.08fr] lg:items-stretch lg:py-9">
          <div className="flex flex-col justify-center py-4 lg:py-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-white/45">
              <span className="h-2 w-2 rounded-full bg-[#FF2D2D]" />
              {content.heroEyebrow}
            </div>
            <h1 className="mt-6 max-w-3xl text-[clamp(3.1rem,6vw,5.8rem)] font-semibold leading-[.88] tracking-[-.065em]">
              {content.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">{content.heroBody}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#prices" className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#111]">See prices</a>
              <a href="#book" className="rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-bold text-white">Book now</a>
              <a href="/quote" className="rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-white/70">Need an exact quote?</a>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] text-center">
              <div className="px-3 py-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/30">Step 1</p><p className="mt-1 text-xs font-semibold sm:text-sm">Pick a service</p></div>
              <div className="border-x border-white/10 px-3 py-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/30">Step 2</p><p className="mt-1 text-xs font-semibold sm:text-sm">Choose a time</p></div>
              <div className="px-3 py-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/30">Step 3</p><p className="mt-1 text-xs font-semibold sm:text-sm">We come to you</p></div>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] bg-black sm:min-h-[390px] lg:min-h-[480px]">
            <Hero360Viewer frames={hero360Frames} className="absolute inset-0 h-full w-full" />
            {hero360Frames.length > 0 && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/12 bg-black/55 p-4 backdrop-blur-md sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Mobile service</p><p className="mt-1 text-sm font-semibold">South Elgin + surrounding areas</p></div>
                  <a href="#book" className="mt-3 inline-flex text-sm font-semibold text-white sm:mt-0">Check availability →</a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white">
        <PageMediaBand categories={["home-showcase-primary", "home-showcase-secondary", "home-story"]} theme="light" eyebrow="A quick look" title="Real work from Car Dash." className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12" />
      </section>

      <section id="prices" className="scroll-mt-24 border-b border-black/8 bg-[#F4F3EF]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 grid gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Prices</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[.94] tracking-[-.055em] sm:text-6xl">See the price first. Then book it.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-black/52 sm:text-base">No digging through a bunch of pages. Full details, interior, exterior, add-ons, and specialty services are all below. Tap the price that matches your vehicle and it goes straight to booking.</p>
          </div>

          <PageMediaBand categories={["home-services-bg"]} theme="light" compact className="mb-8" />

          <div className="mb-10 flex flex-wrap gap-2 border-y border-black/8 py-4 text-sm font-semibold">
            <a href="#prices-packages" className="rounded-full bg-[#111] px-4 py-2.5 text-white">Full detail</a>
            <a href="#prices-interior" className="rounded-full border border-black/10 bg-white px-4 py-2.5">Interior</a>
            <a href="#prices-exterior" className="rounded-full border border-black/10 bg-white px-4 py-2.5">Exterior</a>
            <a href="#extras" className="rounded-full border border-black/10 bg-white px-4 py-2.5">Add-ons</a>
            <a href="#specialty-prices" className="rounded-full border border-black/10 bg-white px-4 py-2.5">Specialty</a>
          </div>

          <SimplePricingHub configs={pricingConfigs} bookingPricing={bookingPricing} services={services} mediaItems={pricingMedia} />
        </div>
      </section>

      <section id="book" className="scroll-mt-24 bg-[#0D0D0D] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.62fr_1.38fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Book</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[.96] tracking-[-.05em] sm:text-5xl">Pick your service, day, and time.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/48">If you tapped a price above, your package is already selected. Fill in the car info, choose an open time, and submit the appointment.</p>
            <div className="mt-6 space-y-3 text-sm text-white/55">
              <p className="flex gap-3"><span className="text-[#FF2D2D]">✓</span>Unavailable days are greyed out.</p>
              <p className="flex gap-3"><span className="text-[#FF2D2D]">✓</span>Booked times disappear automatically.</p>
              <p className="flex gap-3"><span className="text-[#FF2D2D]">✓</span>You see the total before submitting.</p>
            </div>
            <PageMediaBand categories={["home-cta-bg"]} theme="dark" compact className="mt-7" />
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#151515] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-7">
            <BookingForm initialSiteContent={content} />
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Recent work</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">See the work.</h2>
            </div>
            <a href="/gallery" className="hidden text-sm font-semibold text-black/48 sm:block">Full gallery →</a>
          </div>
          <DynamicGallery limit={6} />
        </div>
      </section>

      <section className="bg-[#F4F3EF]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Google reviews</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">What customers say.</h2>
            </div>
            <a href="/reviews" className="text-sm font-semibold text-black/48">See all reviews →</a>
          </div>
          <ReviewCards />
        </div>
      </section>
    </div>
  );
}
