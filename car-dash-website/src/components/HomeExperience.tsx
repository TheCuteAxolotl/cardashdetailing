"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import HeroBackdrop from "@/components/HeroBackdrop";
import SitePhoto from "@/components/SitePhoto";
import DynamicGallery from "@/components/DynamicGallery";
import ServiceCards from "@/components/ServiceCards";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

const process = [
  ["01", "Send the car info", "Choose a service or send the vehicle details if you are not sure what makes sense."],
  ["02", "Lock in the plan", "Condition, timing, location, and anything extra get confirmed before the appointment."],
  ["03", "Get it handled", "The detail gets done with the right setup and a clear focus on the final result."],
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
    <div className="bg-[#070707] text-white">
      <section className="relative isolate min-h-[84vh] overflow-hidden border-b border-white/8">
        <HeroBackdrop />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(220,38,38,.14),transparent_32%)]" />
        <div className="relative mx-auto flex min-h-[84vh] max-w-[1480px] items-end px-5 pb-14 pt-28 sm:px-8 sm:pb-18 lg:px-12 lg:pb-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.18fr_.82fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/45">{content.heroEyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-[clamp(3.6rem,8vw,8.4rem)] font-semibold leading-[0.84] tracking-[-0.065em] text-white">{content.heroTitle}</h1>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-base leading-8 text-white/52 sm:text-lg">{content.heroBody}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/contact" className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500">{content.heroPrimaryCta}</a>
                <a href="/services" className="rounded-full border border-white/14 bg-black/20 px-6 py-3 text-sm font-semibold text-white/72 backdrop-blur transition hover:border-white/30 hover:text-white">{content.heroSecondaryCta}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[.52fr_1.48fr]">
            <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">{content.introEyebrow}</p>
            <div>
              <h2 className="max-w-5xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">{content.introTitle}</h2>
              <p className="mt-7 max-w-3xl text-base leading-8 text-white/43 sm:text-lg">{content.introBody}</p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-12 gap-3 sm:gap-5">
            <div className="col-span-12 overflow-hidden rounded-[1.7rem] sm:col-span-7"><SitePhoto category="home-showcase-primary" className="h-[360px] w-full object-cover sm:h-[570px]" /></div>
            <div className="col-span-7 overflow-hidden rounded-[1.7rem] sm:col-span-5 sm:mt-20"><SitePhoto category="home-showcase-secondary" className="h-[260px] w-full object-cover sm:h-[430px]" /></div>
            <div className="col-span-5 flex items-end sm:col-span-4 sm:col-start-9"><p className="pb-2 text-xs leading-6 text-white/28">Homepage photos can be swapped anytime from the Owner Dashboard.</p></div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#070707]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">{content.servicesEyebrow}</p><p className="mt-5 max-w-md text-sm leading-7 text-white/36">{content.servicesBody}</p></div>
            <h2 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.servicesTitle}</h2>
          </div>
          <div className="mt-12"><ServiceCards limit={3} variant="dark" /></div>
          <a href="/services" className="mt-8 inline-flex text-sm font-semibold text-white/45 transition hover:text-red-400">See all services →</a>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-12">
          <div className="overflow-hidden rounded-[1.8rem]"><SitePhoto category="home-story" className="h-[460px] w-full object-cover sm:h-[620px]" /></div>
          <div className="lg:pl-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">{content.storyEyebrow}</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.storyTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/42">{content.storyBody}</p>
            <a href="/gallery" className="mt-8 inline-flex rounded-full border border-white/13 px-5 py-2.5 text-sm font-semibold text-white/62 transition hover:border-white/28 hover:text-white">See recent work</a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#070707]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">{content.galleryEyebrow}</p><h2 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">{content.galleryTitle}</h2></div>
            <a href="/gallery" className="text-sm font-semibold text-white/40 transition hover:text-white">Full gallery →</a>
          </div>
          <div className="mt-12"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1480px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[.75fr_1.25fr] lg:px-12">
          <div className="overflow-hidden rounded-[1.7rem]"><SitePhoto category="home-process" className="h-[330px] w-full object-cover lg:h-full" /></div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/30">How it works</p>
            <div className="mt-8 border-y border-white/8">
              {process.map(([number, title, copy]) => (
                <article key={number} className="grid gap-4 border-b border-white/8 py-7 last:border-b-0 sm:grid-cols-[70px_1fr]">
                  <span className="text-xs font-semibold text-red-400/75">{number}</span>
                  <div><h3 className="text-2xl font-medium tracking-[-0.03em]">{title}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-white/36">{copy}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-red-600 text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <h2 className="max-w-5xl text-4xl font-medium leading-[.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">{content.contactTitle}</h2>
          <div className="max-w-md"><p className="text-sm leading-7 text-white/72">{content.contactBody}</p><a href="/contact" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#171717]">Send the details</a></div>
        </div>
      </section>
    </div>
  );
}
