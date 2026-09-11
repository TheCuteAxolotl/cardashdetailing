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
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PublicHero imageCategory="about-hero" eyebrowKey="aboutEyebrow" titleKey="aboutTitle" bodyKey="aboutIntro" action={<a href="/contact" className="inline-flex rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] hover:bg-[#FF2D2D]">Book a detail</a>} />

      <section className="bg-[#FFFFFF] text-black">
        <div className="mx-auto grid max-w-[1540px] border-x border-black/10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="min-h-[520px]"><SitePhoto category="about-story" fallbackCategory="home-story" className="h-full min-h-[520px] w-full object-cover" /></div>
          <div className="flex flex-col justify-center border-t border-black/10 px-5 py-16 sm:px-8 lg:border-l lg:border-t-0 lg:px-12 lg:py-24">
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">About</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[.95] tracking-[-.055em] sm:text-6xl">{content.aboutStoryTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-black/52">{content.aboutStoryBody}</p>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-white/10">
        <SitePhoto category="about-values-bg" fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 -z-10 bg-black/86" />
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
          <p className="text-[10px] uppercase tracking-[.28em] text-[#FF2D2D]">The basics</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.aboutValuesTitle}</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              [content.aboutValue1Title, content.aboutValue1Body],
              [content.aboutValue2Title, content.aboutValue2Body],
              [content.aboutValue3Title, content.aboutValue3Body],
            ].map(([title, body], index) => (
              <article key={title} className="bg-[#111318] p-7 sm:p-8">
                <p className="text-xs font-semibold text-[#FF2D2D]">0{index + 1}</p>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-.035em]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/45">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-4 border-x border-black/10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:px-10">
          <a href="/ceramic-coatings" className="group rounded-[28px] border border-black/10 bg-[#F7F9FA] p-7 hover:border-[#FF2D2D]/60">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#4A5568]">Protection Guide</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-.04em]">Ceramic Coatings</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-black/52">Learn how Car Dash approaches coating preparation and the GYEON Synchro and Gtechniq systems used for protection.</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-[#FF2D2D]">Explore coatings →</span>
          </a>
          <a href="/products-we-use" className="group rounded-[28px] border border-black/10 bg-[#F7F9FA] p-7 hover:border-[#FF2D2D]/60">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#4A5568]">Process + Chemistry</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-.04em]">Products We Use</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-black/52">See why Koch-Chemie is a core part of the detailing setup and how product choice changes by surface and condition.</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-[#FF2D2D]">See the product approach →</span>
          </a>
        </div>
      </section>
    </div>
  );
}
