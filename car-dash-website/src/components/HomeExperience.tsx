"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import SitePhoto from "@/components/SitePhoto";
import DynamicGallery from "@/components/DynamicGallery";
import ServiceCards from "@/components/ServiceCards";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

export default function HomeExperience() {
  const [content, setContent] = useState<Content>({ ...SITE_DEFAULTS });
  useEffect(() => { fetch("/api/site-content", { cache: "no-store" }).then(r=>r.ok?r.json():SITE_DEFAULTS).then(d=>setContent({...SITE_DEFAULTS,...d})).catch(()=>{}); }, []);

  return <div className="bg-[#080808] text-white">
    <section className="overflow-hidden border-b border-white/10">
      <div className="mx-auto grid min-h-[78vh] max-w-[1540px] border-x border-white/10 lg:grid-cols-[1.02fr_.98fr]">
        <div className="flex flex-col justify-between px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.3em] text-white/35"><span className="h-2 w-2 rounded-full bg-red-500" />{content.heroEyebrow}</div>
          <div className="py-16 lg:py-24">
            <h1 className="max-w-5xl text-[clamp(4rem,8.2vw,8.8rem)] font-semibold leading-[.82] tracking-[-.072em]">{content.heroTitle}</h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-white/48 sm:text-lg">{content.heroBody}</p>
          </div>
          <div className="flex flex-wrap gap-3"><a href="/contact" className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold">{content.heroPrimaryCta}</a><a href="/services" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/70">{content.heroSecondaryCta}</a></div>
        </div>
        <div className="relative min-h-[520px] border-t border-white/10 lg:border-l lg:border-t-0">
          <SitePhoto category="hero" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/15" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between rounded-[22px] border border-white/12 bg-black/35 p-5 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8"><div><p className="text-[10px] uppercase tracking-[.25em] text-white/35">Mobile setup</p><p className="mt-2 max-w-xs text-lg font-medium">At the driveway. No shop drop-off needed.</p></div><span className="text-3xl text-red-500">↘</span></div>
        </div>
      </div>
    </section>

    <section className="bg-[#f2efe7] text-black">
      <div className="mx-auto max-w-[1540px] border-x border-black/10 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[.38fr_1.62fr]"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-red-600">{content.introEyebrow}</p><div><h2 className="max-w-6xl text-4xl font-semibold leading-[.96] tracking-[-.052em] sm:text-6xl lg:text-7xl">{content.introTitle}</h2><p className="mt-7 max-w-3xl text-base leading-8 text-black/48">{content.introBody}</p></div></div>
        <div className="mt-16 grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><div className="overflow-hidden rounded-[28px]"><SitePhoto category="home-showcase-primary" className="h-[520px] w-full object-cover sm:h-[680px]" /></div><div className="grid gap-4"><div className="overflow-hidden rounded-[28px]"><SitePhoto category="home-showcase-secondary" className="h-[330px] w-full object-cover" /></div><div className="rounded-[28px] bg-black p-7 text-white"><p className="text-[10px] uppercase tracking-[.25em] text-white/30">Owner controlled</p><p className="mt-6 text-3xl font-semibold tracking-[-.04em]">Swap these photos anytime from the dashboard.</p><a href="/gallery" className="mt-8 inline-flex text-sm text-red-400">See the work →</a></div></div></div>
      </div>
    </section>

    <section className="border-y border-white/10 bg-[#080808]">
      <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] uppercase tracking-[.28em] text-red-400">{content.servicesEyebrow}</p><h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.servicesTitle}</h2></div><p className="max-w-lg text-sm leading-7 text-white/42">{content.servicesBody}</p></div>
        <div className="mt-12"><ServiceCards limit={3} variant="dark" /></div>
      </div>
    </section>

    <section className="bg-[#f2efe7] text-black"><div className="mx-auto grid max-w-[1540px] border-x border-black/10 lg:grid-cols-2"><div className="min-h-[500px]"><SitePhoto category="home-story" className="h-full min-h-[500px] w-full object-cover" /></div><div className="flex flex-col justify-center border-t border-black/10 px-5 py-16 sm:px-8 lg:border-l lg:border-t-0 lg:px-12"><p className="text-[10px] uppercase tracking-[.28em] text-red-600">{content.storyEyebrow}</p><h2 className="mt-5 text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-6xl">{content.storyTitle}</h2><p className="mt-7 max-w-xl text-base leading-8 text-black/48">{content.storyBody}</p></div></div></section>

    <section className="bg-[#0a0a0a]"><div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10"><div className="flex items-end justify-between gap-6"><div><p className="text-[10px] uppercase tracking-[.28em] text-red-400">{content.galleryEyebrow}</p><h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.galleryTitle}</h2></div><a href="/gallery" className="hidden text-sm text-white/45 sm:block">Full gallery →</a></div><div className="mt-10"><DynamicGallery limit={6}/></div></div></section>

    <section className="bg-red-600 text-white"><div className="mx-auto grid max-w-[1540px] gap-8 border-x border-white/20 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:px-10"><h2 className="text-5xl font-semibold leading-[.9] tracking-[-.06em] sm:text-7xl">{content.contactTitle}</h2><div><p className="text-sm leading-7 text-white/72">{content.contactBody}</p><a href="/contact" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold">Book a detail</a></div></div></section>
  </div>;
}
