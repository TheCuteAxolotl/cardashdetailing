"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import HeroBackdrop from "@/components/HeroBackdrop";
import SitePhoto from "@/components/SitePhoto";
import DynamicGallery from "@/components/DynamicGallery";
import ServiceCards from "@/components/ServiceCards";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

const process = [
  ["01", "Choose the service", "Pick a package or send the vehicle details for a recommendation."],
  ["02", "Confirm the appointment", "Availability, vehicle condition, and any extra work are confirmed before the detail."],
  ["03", "Car Dash comes to you", "The setup, products, and equipment arrive at the vehicle so the process stays simple."],
];

export default function HomeExperience() {
  const [content, setContent] = useState<Content>({ ...SITE_DEFAULTS });

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : SITE_DEFAULTS))
      .then((data) => setContent({ ...SITE_DEFAULTS, ...data }))
      .catch(() => setContent({ ...SITE_DEFAULTS }));
  }, []);

  return (
    <div className="bg-[#080808] text-white">
      <section className="relative isolate min-h-[82vh] overflow-hidden border-b border-white/10">
        <HeroBackdrop />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(225,29,72,.15),transparent_30%)]" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-[1480px] items-end px-5 pb-12 pt-28 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/55">{content.heroEyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-[clamp(3.6rem,8vw,8.6rem)] font-semibold leading-[0.83] tracking-[-0.065em] text-white">
                {content.heroTitle}
              </h1>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-base leading-8 text-white/58 sm:text-lg">{content.heroBody}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/contact" className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500">
                  {content.heroPrimaryCta}
                </a>
                <a href="/services" className="rounded-full border border-white/18 bg-black/20 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:border-white/35 hover:text-white">
                  {content.heroSecondaryCta}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[.55fr_1.45fr]">
            <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">{content.introEyebrow}</p>
            <div>
              <h2 className="max-w-5xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">{content.introTitle}</h2>
              <p className="mt-7 max-w-3xl text-base leading-8 text-white/48 sm:text-lg">{content.introBody}</p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-12 gap-3 sm:gap-5">
            <div className="col-span-12 overflow-hidden rounded-[1.6rem] sm:col-span-7">
              <SitePhoto category="home-showcase-primary" className="h-[360px] w-full object-cover sm:h-[560px]" />
            </div>
            <div className="col-span-7 overflow-hidden rounded-[1.6rem] sm:col-span-5 sm:mt-20">
              <SitePhoto category="home-showcase-secondary" className="h-[260px] w-full object-cover sm:h-[420px]" />
            </div>
            <div className="col-span-5 flex items-end sm:col-span-4 sm:col-start-9">
              <p className="pb-2 text-xs leading-6 text-white/36">Upload these homepage images from Owner Dashboard → Website Photos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">{content.servicesEyebrow}</p>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/42">{content.servicesBody}</p>
            </div>
            <div>
              <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.servicesTitle}</h2>
            </div>
          </div>
          <div className="mt-12"><ServiceCards limit={3} variant="dark" /></div>
          <a href="/services" className="mt-8 inline-flex text-sm font-semibold text-white/55 transition hover:text-red-400">View all services →</a>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-12">
          <div className="overflow-hidden rounded-[1.8rem]">
            <SitePhoto category="home-story" className="h-[460px] w-full object-cover sm:h-[620px]" />
          </div>
          <div className="lg:pl-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">{content.storyEyebrow}</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.storyTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/48">{content.storyBody}</p>
            <a href="/gallery" className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white">See the work</a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">{content.galleryEyebrow}</p>
              <h2 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.galleryTitle}</h2>
            </div>
            <a href="/gallery" className="text-sm font-semibold text-white/48 transition hover:text-white">Full gallery →</a>
          </div>
          <div className="mt-12"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/35">Simple process</p>
          <div className="mt-10 grid gap-0 border-y border-white/10 md:grid-cols-3">
            {process.map(([number, title, copy], index) => (
              <article key={number} className={`py-8 md:px-8 ${index > 0 ? "border-t border-white/10 md:border-l md:border-t-0" : ""}`}>
                <span className="text-xs font-semibold text-red-500/80">{number}</span>
                <h3 className="mt-10 text-2xl font-medium tracking-[-0.03em]">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/42">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-red-600 text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <h2 className="max-w-5xl text-4xl font-medium leading-[.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">{content.contactTitle}</h2>
          <div className="max-w-md">
            <p className="text-sm leading-7 text-white/75">{content.contactBody}</p>
            <a href="/contact" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#171717]">Book a detail</a>
          </div>
        </div>
      </section>
    </div>
  );
}
