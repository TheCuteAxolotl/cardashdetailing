"use client";

import { useEffect, useState } from "react";
import PublicHero from "@/components/PublicHero";
import SitePhoto from "@/components/SitePhoto";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

export default function AboutPage() {
  const [content, setContent] = useState<Record<string, string>>({ ...SITE_DEFAULTS });

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : SITE_DEFAULTS))
      .then((data) => setContent({ ...SITE_DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PublicHero imageCategory="about-hero" eyebrowKey="aboutEyebrow" titleKey="aboutTitle" bodyKey="aboutIntro" action={<a href="/contact" className="inline-flex rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold hover:bg-red-500">Book a detail</a>} />

      <section className="bg-[#f4f1ea] text-black">
        <div className="mx-auto grid max-w-[1540px] border-x border-black/10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="min-h-[520px]"><SitePhoto category="about-story" fallbackCategory="home-story" className="h-full min-h-[520px] w-full object-cover" /></div>
          <div className="flex flex-col justify-center border-t border-black/10 px-5 py-16 sm:px-8 lg:border-l lg:border-t-0 lg:px-12 lg:py-24">
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-red-600">About</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[.95] tracking-[-.055em] sm:text-6xl">{content.aboutStoryTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-black/52">{content.aboutStoryBody}</p>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-white/10">
        <SitePhoto category="about-values-bg" fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 -z-10 bg-black/86" />
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
          <p className="text-[10px] uppercase tracking-[.28em] text-red-400">The basics</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.aboutValuesTitle}</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              [content.aboutValue1Title, content.aboutValue1Body],
              [content.aboutValue2Title, content.aboutValue2Body],
              [content.aboutValue3Title, content.aboutValue3Body],
            ].map(([title, body], index) => (
              <article key={title} className="bg-[#0a0a0a] p-7 sm:p-8">
                <p className="text-xs font-semibold text-red-400">0{index + 1}</p>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-.035em]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/45">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
