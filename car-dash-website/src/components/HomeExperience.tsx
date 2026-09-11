"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import SitePhoto from "@/components/SitePhoto";
import DynamicGallery from "@/components/DynamicGallery";
import ServiceCards from "@/components/ServiceCards";
import SocialLinks from "@/components/SocialLinks";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

export default function HomeExperience() {
  const [content, setContent] = useState<Content>({ ...SITE_DEFAULTS });

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : SITE_DEFAULTS))
      .then((d) => setContent({ ...SITE_DEFAULTS, ...d }))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#070707] text-white">
      <section className="relative isolate min-h-[88vh] overflow-hidden border-b border-white/10">
        <SitePhoto category="hero" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(0,0,0,.94)_0%,rgba(0,0,0,.78)_44%,rgba(0,0,0,.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.2)_0%,rgba(0,0,0,.12)_55%,rgba(0,0,0,.86)_100%)]" />

        <div className="mx-auto flex min-h-[88vh] max-w-[1540px] flex-col justify-between border-x border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.3em] text-white/45">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {content.heroEyebrow}
          </div>

          <div className="max-w-6xl py-16 lg:py-24">
            <h1 className="max-w-5xl text-[clamp(4.6rem,9vw,10.5rem)] font-semibold leading-[.78] tracking-[-.078em]">
              {content.heroTitle}
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
              {content.heroBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/contact" className="rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold transition hover:bg-red-500">
                {content.heroPrimaryCta}
              </a>
              <a href="/services" className="rounded-full border border-white/18 bg-black/20 px-6 py-3.5 text-sm font-semibold text-white/78 backdrop-blur transition hover:border-white/35 hover:text-white">
                {content.heroSecondaryCta}
              </a>
            </div>
          </div>

          <div className="border-t border-white/12 pt-5 text-xs text-white/38">
            <span>Interior · Exterior · Paint Correction · Protection</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f1ea] text-black">
        <div className="mx-auto max-w-[1540px] border-x border-black/10 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[.35fr_1.65fr]">
            <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-red-600">{content.introEyebrow}</p>
            <div>
              <h2 className="max-w-6xl text-4xl font-semibold leading-[.94] tracking-[-.058em] sm:text-6xl lg:text-7xl">{content.introTitle}</h2>
              <p className="mt-7 max-w-3xl text-base leading-8 text-black/52">{content.introBody}</p>
            </div>
          </div>

          <div className="mt-16 grid gap-4 lg:grid-cols-[1.28fr_.72fr]">
            <div className="group relative overflow-hidden rounded-[30px] bg-black">
              <SitePhoto category="home-showcase-primary" className="h-[520px] w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:h-[690px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <p className="absolute bottom-6 left-6 text-xs font-medium uppercase tracking-[.2em] text-white/70">Recent work</p>
            </div>
            <div className="grid gap-4">
              <div className="group relative overflow-hidden rounded-[30px] bg-black">
                <SitePhoto category="home-showcase-secondary" className="h-[330px] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              <div className="rounded-[30px] bg-[#0a0a0a] p-8 text-white">
                <p className="text-[10px] uppercase tracking-[.27em] text-red-400">Easy to book</p>
                <p className="mt-6 text-3xl font-semibold leading-[1.02] tracking-[-.045em]">Send the vehicle details. Get a clear answer. Get it handled.</p>
                <a href="/contact" className="mt-8 inline-flex text-sm font-semibold text-white/65 transition hover:text-white">Start a request →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-y border-white/10 bg-[#080808]">
        <SitePhoto category="home-services-bg" fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-black/82" />
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.28em] text-red-400">{content.servicesEyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{content.servicesTitle}</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-white/48">{content.servicesBody}</p>
          </div>
          <div className="mt-12"><ServiceCards limit={3} variant="dark" /></div>
        </div>
      </section>

      <section className="bg-[#f4f1ea] text-black">
        <div className="mx-auto grid max-w-[1540px] border-x border-black/10 lg:grid-cols-2">
          <div className="min-h-[520px]"><SitePhoto category="home-story" className="h-full min-h-[520px] w-full object-cover" /></div>
          <div className="flex flex-col justify-center border-t border-black/10 px-5 py-16 sm:px-8 lg:border-l lg:border-t-0 lg:px-12">
            <p className="text-[10px] uppercase tracking-[.28em] text-red-600">{content.storyEyebrow}</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[.96] tracking-[-.055em] sm:text-6xl">{content.storyTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-black/52">{content.storyBody}</p>
            <div className="mt-8 flex gap-3">
              <a href="/about" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">About Car Dash</a>
              <a href="/faq" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold">FAQ</a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#090909]">
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[.28em] text-red-400">{content.galleryEyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.galleryTitle}</h2>
            </div>
            <a href="/gallery" className="hidden text-sm text-white/45 transition hover:text-white sm:block">Full gallery →</a>
          </div>
          <div className="mt-10"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-red-600 text-white">
        <SitePhoto category="home-cta-bg" fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-red-700/75 mix-blend-multiply" />
        <div className="mx-auto grid max-w-[1540px] gap-8 border-x border-white/20 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-10">
          <h2 className="text-5xl font-semibold leading-[.9] tracking-[-.06em] sm:text-7xl">{content.contactTitle}</h2>
          <div>
            <p className="text-sm leading-7 text-white/78">{content.contactBody}</p>
            <a href="/contact" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold">Book a detail</a>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f1ea] text-black">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-6 border-x border-black/10 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-black/35">Follow Car Dash</p>
            <p className="mt-2 text-lg font-semibold">Work, updates, and reviews.</p>
          </div>
          <SocialLinks light />
        </div>
      </section>
    </div>
  );
}
