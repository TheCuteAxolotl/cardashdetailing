"use client";

import { useState } from "react";
import styles from "./HomeExperience.module.css";
import type { SiteContent } from "@/lib/site-defaults";
import { SERVICE_AREAS } from "@/lib/seo";
import type { PromotionSettings } from "@/lib/promotions";
import type { PricingPageConfig } from "@/lib/pricing-config";
import DynamicGallery from "@/components/DynamicGallery";
import ReviewCards from "@/components/ReviewCards";
import HomePackagePricing from "@/components/HomePackagePricing";
import type { MediaItem } from "@/lib/media";
import PageMediaBand from "@/components/PageMediaBand";
import Hero360Viewer from "@/components/Hero360Viewer";
import SitePhoto from "@/components/SitePhoto";

type Props = {
  initialContent: SiteContent;
  pricingConfig: PricingPageConfig;
  promotions?: PromotionSettings;
  pricingMedia?: MediaItem[];
  hero360Frames?: MediaItem[];
};

export default function HomeExperience({
  initialContent: content,
  pricingConfig,
  promotions,
  pricingMedia = [],
  hero360Frames = [],
}: Props) {
  const [heroInteracting, setHeroInteracting] = useState(false);

  return (
    <div className={`${styles.experience} bg-[#f5f4f1] text-[#111]`}>
      <section className={styles.hero}>
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
              <a href="/quote" className="hidden rounded-full border border-white/24 bg-black/15 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white hover:text-black sm:inline-flex">Get an exact quote</a>
            </div>

            <div className="home-hero-copy max-w-[900px] pb-5 text-white sm:pb-9">
              <p className="mb-5 text-sm font-medium tracking-[.01em] text-white/62">We come to you. No shop drop-off.</p>
              <h1 className="max-w-[12ch] text-[clamp(3.55rem,7.8vw,7.8rem)] font-semibold leading-[.84] tracking-[-.075em]">
                <>Clean.<br />Refined.<br />Protected.</>
              </h1>
              <p className="mt-7 max-w-[650px] text-sm leading-7 text-white/68 sm:text-base sm:leading-8">{content.heroBody}</p>
              <p className="mt-5 max-w-[650px] border-l-2 border-[#d6b779] pl-4 text-sm font-medium leading-6 tracking-[-.01em] text-white/90 sm:text-base">We’re not satisfied until <span className="font-semibold text-[#d6b779]">YOU’RE satisfied.</span></p>
              <div className="home-hero-actions mt-8 flex flex-wrap gap-3">
                <a href="#book" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111] shadow-[0_12px_32px_rgba(0,0,0,.12)] hover:bg-[#ece9e3]">Book a detail</a>
                <a href="#prices" className="rounded-full border border-white/24 bg-black/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/8">View pricing</a>
              </div>
            </div>
          </div>
          {hero360Frames.length > 1 && !heroInteracting && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/16 bg-black/25 px-3 py-2 text-[9px] font-medium uppercase tracking-[.14em] text-white/62 backdrop-blur-md sm:bottom-5 sm:right-5 sm:text-[10px]">
              <span className="sm:hidden">Swipe</span><span className="hidden sm:inline">Drag to explore</span>
            </div>
          )}
        </div>
      </section>

      <section className={styles.manifesto} aria-labelledby="care-heading">
        <div data-reveal><p className={styles.eyebrow}>Care you can see. A difference you can feel.</p><h2 id="care-heading">Some details change<br />how your car looks.<br /><em>Ours change how it feels.</em></h2><p>A fresh interior. A finish that catches the light. Thoughtful care, brought to your driveway.</p></div>
        <div className={styles.locations} aria-label="Communities within about 20 miles of South Elgin">
          <p className={styles.locationsHeading}>Mobile detailing within 20 miles of South Elgin</p>
          <div className={styles.locationList}>
            {SERVICE_AREAS.map((area) => <span key={area}>{area.replace(", Illinois", "")}</span>)}
          </div>
          <p className={styles.locationsNote}>Service availability depends on your exact address and appointment schedule.</p>
        </div>
      </section>

      <section className={styles.proof}>
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

      <section className={styles.services} aria-labelledby="craft-heading">
        <div className={styles.sectionHeading} data-reveal>
          <div><p className={styles.eyebrow}>The Car Dash approach</p><h2 id="craft-heading">Every surface.<br /><span>Every detail.</span></h2></div>
          <div><p>From the seat you settle into to the finish that catches the light. Give your vehicle the attention it deserves, right in your driveway.</p><a href="/quote" className={styles.goldButton}>Get an exact quote</a></div>
        </div>
        <div className={styles.serviceGrid}>
          {[
            { number: "01", title: "A fresh start inside.", label: "Interior detailing", href: "/interior-detailing", image: "pricing-interior-hero", fallback: "home-showcase-secondary", text: "Seats, carpets, vents, and the little places everyday life leaves its mark." },
            { number: "02", title: "Make an entrance.", label: "Exterior detailing", href: "/exterior-detailing", image: "pricing-exterior-hero", fallback: "home-showcase-primary", text: "Careful cleaning and finishing for paint, wheels, glass, and trim." },
            { number: "03", title: "Protect the finish.", label: "Ceramic coatings", href: "/ceramic-coatings", image: "ceramic-coatings-hero", fallback: "hero", text: "Explore coating options and preparation tailored to your vehicle." },
          ].map((service) => (
            <a key={service.number} href={service.href} className={styles.serviceCard} data-reveal>
              <div className={styles.cardPhoto}><SitePhoto category={service.image} fallbackCategory={service.fallback} className="absolute inset-0 h-full w-full" alt={service.label} /><span className={styles.cardNumber}>{service.number}</span></div>
              <div className={styles.cardCopy}><p className={styles.eyebrow}>{service.label}</p><h3>{service.title}</h3><p>{service.text}</p></div>
            </a>
          ))}
        </div>
        <div className={styles.standard} data-reveal>
          <p className={styles.eyebrow}>Our standard</p><h2>We’re not satisfied<br />until you’re satisfied.</h2><a href="/about">Meet Daniel</a>
        </div>
      </section>

      <section className={styles.transformation} aria-labelledby="finish-heading">
        <div className={styles.transformPhoto}><SitePhoto category="paint-correction-hero" fallbackCategory="home-showcase-primary" className="absolute inset-0 h-full w-full" alt="Vehicle finish from Car Dash Detailing’s work gallery" /></div>
        <div className={styles.transformCopy} data-reveal><p className={styles.eyebrow}>Paint correction · South Elgin & nearby suburbs</p><h2 id="finish-heading">Bring back<br />the brilliance.</h2><p>Swirls and dullness can hide what’s underneath. Explore paint correction matched to your paint’s condition, then choose the protection that fits.</p><a href="/paint-correction" className={styles.goldButton}>Explore paint correction</a></div>
      </section>

      <section className={styles.portfolio}>
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">Recent work</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">A closer look at the details.</h2>
            </div>
            <div className="flex items-end justify-between gap-5">
              <p className="max-w-xl text-sm leading-7 text-black/48">Interiors, exterior details, paint correction, coatings — real jobs we’ve finished for customers.</p>
              <a href="/gallery" className="hidden shrink-0 text-sm font-semibold text-black/55 hover:text-black sm:block">View full gallery →</a>
            </div>
          </div>
          <div className="home-gallery mt-10"><DynamicGallery limit={6} cinematic /></div>
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
          <HomePackagePricing config={pricingConfig} mediaItems={pricingMedia} promotions={promotions} />
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/[.08] pt-6 text-sm font-medium text-black/52">
            <a href="/interior-detailing" className="hover:text-black">Interior only →</a>
            <a href="/exterior-detailing" className="hover:text-black">Exterior only →</a>
            <a href="/paint-correction" className="hover:text-black">Paint correction →</a>
            <a href="/ceramic-coatings" className="hover:text-black">Ceramic coating →</a>
            <a href="/maintenance" className="hover:text-black">Monthly maintenance →</a>
          </div>
        </div>
      </section>

      <section id="maintenance" className="border-b border-black/[.08] bg-[#EFE8E2] px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-8 overflow-hidden rounded-[20px] border border-black/[.08] bg-[#171411] p-6 text-white shadow-[0_26px_80px_rgba(23,20,17,.12)] sm:p-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:p-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/36">Ceramic maintenance membership</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Keep your coating maintained every month.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48">A simple recurring maintenance plan for ceramic-coated vehicles. Set up billing once and keep your monthly maintenance with Car Dash.</p>
            <a href="/maintenance" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171411]">Join monthly maintenance</a>
          </div>
          <div className="border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-end gap-2"><span className="text-6xl font-semibold tracking-[-.07em]">$60</span><span className="pb-2 text-sm text-white/38">/ month</span></div>
            <p className="mt-3 text-xs leading-5 text-white/32">Recurring billing through Stripe. Customers can manage or cancel future renewals themselves.</p>
          </div>
        </div>
      </section>

      <section id="booking-info" className="border-y border-white/10 bg-[#151515] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d6b779]">Book Car Dash</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">Your detail, on your schedule.</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">Choose your service and available appointment time in our secure booking window. You’ll see your estimated total before submitting.</p>
          </div>
          <a href="/#book" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#d6b779] px-7 py-4 text-sm font-bold text-[#101010] transition hover:bg-[#e5c995]">
            Book an appointment
            <span aria-hidden="true" className="ml-3">→</span>
          </a>
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
