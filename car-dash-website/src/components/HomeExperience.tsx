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
        <div className="home-hero-shell relative mx-auto min-h-[520px] max-w-[1440px] overflow-hidden bg-[#111] sm:min-h-[740px] lg:min-h-[780px]">
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

          <div className={`home-hero-content relative z-10 flex min-h-[520px] flex-col justify-between px-5 py-7 transition-opacity duration-300 sm:min-h-[740px] sm:px-9 sm:py-9 lg:min-h-[780px] lg:px-14 lg:py-12 ${heroInteracting ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <div className="flex items-start justify-between gap-5 text-white">
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/64"><span className="h-px w-8 bg-white/35" />{content.heroEyebrow}</p>
            </div>

            <div className="home-hero-copy max-w-[900px] pb-5 text-white sm:pb-9">
              <p className="mb-5 text-sm font-medium tracking-[.01em] text-white/62">We come to you. No shop drop-off.</p>
              <h1 className="max-w-[14ch] text-[clamp(3.2rem,7.2vw,6.8rem)] font-semibold leading-[.84] tracking-[-.075em]">
                <>Your car.<br />Cleaned at<br />your door.</>
              </h1>
              <p className="mt-6 max-w-[540px] text-sm leading-6 text-white/80 sm:hidden">Choose your service. See the price. Pick a time. We come to you.</p>
              <p className="mt-7 hidden max-w-[650px] text-sm leading-7 text-white/68 sm:block sm:text-base sm:leading-8">{content.heroBody}</p>
              <p className="mt-5 max-w-[650px] border-l-2 border-[#d6b779] pl-4 text-sm font-medium leading-6 tracking-[-.01em] text-white/90 sm:text-base">We’re not satisfied until <span className="font-semibold text-[#d6b779]">YOU’RE satisfied.</span></p>
              <div className="home-hero-actions mt-8 flex flex-wrap gap-3">
                <a href="#choose-detail" className="rounded-full bg-[#d6b779] px-6 py-3.5 text-sm font-bold text-[#111] shadow-[0_12px_32px_rgba(0,0,0,.12)] hover:bg-[#ead09b]">Choose a detail</a>
                <a href="/quote" className="rounded-full border border-white/24 bg-black/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/8">Get a Quote</a>
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


      <section id="choose-detail" aria-labelledby="quick-book-heading" className={styles.quickBook}>
        <div className={styles.quickBookInner}>
          <div className={styles.quickBookIntro}>
            <SitePhoto
              category="hero"
              fallbackCategory="home-showcase-primary"
              className={styles.quickBookIntroPhoto + " absolute inset-0 h-full w-full"}
              alt="Car Dash Detailing vehicle finish"
            />
            <div className={styles.quickBookIntroContent}>
              <p className={styles.quickBookEyebrow}>Start here</p>
              <h2 id="quick-book-heading" className={styles.quickBookHeading}>
                What do you <span>need cleaned?</span>
              </h2>
              <p className={styles.quickBookHelp}>Tap one option. We’ll guide you through the rest.</p>
            </div>
            <p className={styles.quickBookIntroNote}>Mobile detailing. We come to you.</p>
          </div>

          <div className={styles.quickBookGrid}>
            {[
              { href: "/?pricingPage=packages#book", title: "Inside + outside", detail: "Full car detail", mark: "01", image: "pricing-car-packages-hero", fallback: "home-showcase-primary", featured: true },
              { href: "/?pricingPage=interior#book", title: "Interior only", detail: "Seats, carpets, dash", mark: "02", image: "pricing-interior-hero", fallback: "home-showcase-secondary" },
              { href: "/?pricingPage=exterior#book", title: "Exterior only", detail: "Paint, wheels, glass", mark: "03", image: "pricing-exterior-hero", fallback: "home-showcase-primary" },
              { href: "/quote", title: "Not sure?", detail: "Get a custom quote", mark: "04", image: "home-showcase-primary", fallback: "hero" },
            ].map((option) => (
              <a
                key={option.href}
                href={option.href}
                className={[styles.quickBookCard, option.featured && styles.quickBookCardFeatured].filter(Boolean).join(" ")}
                aria-label={option.title + ": " + option.detail}
              >
                <SitePhoto
                  category={option.image}
                  fallbackCategory={option.fallback}
                  className={styles.quickBookCardPhoto + " absolute inset-0 h-full w-full"}
                  alt={option.title + " detailing"}
                />
                <div className={styles.quickBookCardTop}>
                  <span className={styles.quickBookNumber}>{option.mark}</span>
                  <span className={styles.quickBookArrow} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
                <div className={styles.quickBookCardBottom}>
                  <h3>{option.title}</h3>
                  <p>{option.detail}</p>
                </div>
              </a>
            ))}
          </div>
          <p className={styles.quickBookSteps}>Choose a detail <span>›</span> Pick a date <span>›</span> Enter your address <span>›</span> Send your request</p>
        </div>
      </section>

      <section className="bg-[#f5f4f1] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-9 flex items-end justify-between gap-5 border-b border-black/[.08] pb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">Customer feedback</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">See what customers are saying.</h2>
            </div>
            <a href="/reviews" className="hidden text-sm font-semibold text-black/50 hover:text-black sm:block">All reviews</a>
          </div>
          <ReviewCards />
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
          <div><p>From the seat you settle into to the finish that catches the light. Give your vehicle the attention it deserves, right in your driveway.</p><a href="/quote" className={styles.goldButton}>Get a Quote</a></div>
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
              <a href="/gallery" className="hidden shrink-0 text-sm font-semibold text-black/55 hover:text-black sm:block">View full gallery</a>
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
            <a href="/interior-detailing" className="hover:text-black">Interior only</a>
            <a href="/exterior-detailing" className="hover:text-black">Exterior only</a>
            <a href="/paint-correction" className="hover:text-black">Paint correction</a>
            <a href="/ceramic-coatings" className="hover:text-black">Ceramic coating</a>
            <a href="/maintenance" className="hover:text-black">Monthly maintenance</a>
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
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_.9fr] lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Car Dash · Online appointments</p>
            <h2 className="mt-4 max-w-[15ch] text-4xl font-semibold leading-[1.04] tracking-[-.055em] sm:text-5xl">Detailing, without the back and forth.</h2>
            <p className="mt-5 max-w-lg text-sm leading-8 text-white/65 sm:text-base">Choose a service, find a time that works, and send your booking request in one clean experience. We bring the detail to your driveway.</p>
            <div className="mt-7 grid max-w-lg gap-3 sm:grid-cols-2">
              {["Browse real services and prices","Choose an available time","Tell us where to arrive","Review before submitting"].map((label, index) => (
                <div key={label} className="flex items-center gap-3 text-sm text-white/75">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d6b779]/45 text-xs font-semibold text-[#e5c995]">{index+1}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/#book" className="inline-flex items-center justify-center rounded-full bg-[#d6b779] px-7 py-4 text-sm font-bold text-[#161616] transition hover:bg-[#e5c995]">Book an appointment</a>
              <a href="/quote" className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-semibold text-[#f4efe5] transition hover:border-[#d6b779]/60">Get a quote</a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-[28px] border border-[#d6b779]/25 bg-[#232322] p-4 shadow-[0_36px_90px_rgba(0,0,0,.35)] sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#d6b779]">Car Dash Detailing</p>
                <p className="mt-1 text-xl font-semibold tracking-tight">Pick your detail</p></div>
              <span className="rounded-full border border-[#d6b779]/25 bg-[#d6b779]/10 px-3 py-1.5 text-[10px] font-semibold text-[#e5c995]">Step 1 of 4</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#d6b779] px-3 py-2 text-[11px] font-semibold text-[#171717]">Full Detail</span>
              <span className="rounded-full border border-white/15 px-3 py-2 text-[11px] text-white/60">Interior</span>
              <span className="rounded-full border border-white/15 px-3 py-2 text-[11px] text-white/60">Exterior</span>
            </div>
            <div className="mt-4 space-y-2">
              {pricingConfig.packages.slice(0,3).map(pkg => (
                <a key={pkg.id} href={"/?pricingPage=packages&packageId=" + encodeURIComponent(pkg.id) + "&vehicleClass=coupe#book"}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] p-2.5 transition hover:border-[#d6b779]/45">
                  <SitePhoto category={"pricing-car-packages-pkg-" + pkg.id} fallbackCategory="pricing-car-packages-hero"
                    className="h-[62px] w-[86px] shrink-0 rounded-lg" alt={pkg.name} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{pkg.name}</span>
                    <span className="mt-1 block text-xs text-white/45">Sedan · Starting at {"$" + Number(pkg.prices.coupe || 0).toFixed(0)}</span></span>
                  <span className="rounded-full border border-[#d6b779]/35 px-3 py-1.5 text-[11px] font-semibold text-[#e5c995]">Book</span>
                </a>
              ))}
            </div>
            <a href="/#book" className="mt-4 block rounded-xl bg-[#d6b779] px-4 py-3.5 text-center text-sm font-bold text-[#171717] hover:bg-[#e5c995]">Browse all services</a>
            <p className="mt-3 text-center text-[10px] text-white/35">Live pricing and appointment availability are shown in the booking window.</p>
          </div>
        </div>
      </section>


    </div>
  );
}
