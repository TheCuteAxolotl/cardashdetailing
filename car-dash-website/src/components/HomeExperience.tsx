"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import SitePhoto from "@/components/SitePhoto";
import DynamicGallery from "@/components/DynamicGallery";
import ReviewCards from "@/components/ReviewCards";
import SocialLinks from "@/components/SocialLinks";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

const SERVICE_GROUPS = [
  {
    eyebrow: "Car detailing",
    title: "Interior + exterior detailing",
    body: "Full-detail packages, interior resets, exterior care, and maintenance options for daily drivers, SUVs, trucks, and enthusiast vehicles.",
    href: "/car-detailing-packages",
    link: "View car detailing",
    category: "pricing-car-packages-hero",
    fallbackCategory: "home-showcase-primary",
  },
  {
    eyebrow: "Paint + protection",
    title: "Correction + ceramic protection",
    body: "Paint enhancement, defect correction, and ceramic protection when the goal is more gloss, clarity, and longer-lasting protection.",
    href: "/paint-correction",
    link: "Explore paint + protection",
    category: "paint-correction-hero",
    fallbackCategory: "home-showcase-secondary",
  },
  {
    eyebrow: "Marine detailing",
    title: "Boat cleaning + protection",
    body: "Marine interior, hull, deck, maintenance, enhancement, and protection services built around the condition of the boat.",
    href: "/marine-detailing",
    link: "View marine detailing",
    category: "marine-hero",
    fallbackCategory: "home-services-bg",
  },
] as const;

export default function HomeExperience() {
  const [content, setContent] = useState<Content>({ ...SITE_DEFAULTS });
  const [showFloatingQuote, setShowFloatingQuote] = useState(false);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : SITE_DEFAULTS))
      .then((d) => setContent({ ...SITE_DEFAULTS, ...d }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateFloatingQuote = () => {
      const revealPoint = Math.max(520, window.innerHeight * 0.68);
      setShowFloatingQuote(window.scrollY > revealPoint);
    };

    updateFloatingQuote();
    window.addEventListener("scroll", updateFloatingQuote, { passive: true });
    window.addEventListener("resize", updateFloatingQuote);

    return () => {
      window.removeEventListener("scroll", updateFloatingQuote);
      window.removeEventListener("resize", updateFloatingQuote);
    };
  }, []);

  return (
    <div className="bg-[#0D0D0D] text-white">
      <a
        href="/quote"
        aria-label="Get an Exact Quote"
        className={`fixed bottom-5 right-[8.65rem] z-[69] rounded-full border border-white/10 bg-[#0D0D0D] px-4 py-3 text-xs font-semibold text-white shadow-[0_18px_50px_rgba(0,0,0,.28)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-black sm:right-[9.35rem] sm:px-5 sm:text-sm ${
          showFloatingQuote
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <span className="sm:hidden">Exact Quote</span>
        <span className="hidden sm:inline">Get an Exact Quote</span>
      </a>

      <section className="relative isolate min-h-[88vh] overflow-hidden border-b border-white/10">
        <SitePhoto category="hero" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(0,0,0,.94)_0%,rgba(0,0,0,.78)_44%,rgba(0,0,0,.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.2)_0%,rgba(0,0,0,.12)_55%,rgba(0,0,0,.86)_100%)]" />

        <div className="mx-auto flex min-h-[88vh] max-w-[1540px] flex-col justify-between border-x border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.3em] text-white/45">
            <span className="h-2 w-2 rounded-full bg-[#FF2D2D]" />
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
              <a href="/quote" className="rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] transition hover:bg-[#FF2D2D]">
                {["book a detail", "get a quote"].includes(content.heroPrimaryCta.trim().toLowerCase()) ? "Get an Exact Quote" : content.heroPrimaryCta}
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

      <section className="bg-[#F4F4F2] text-black">
        <div className="mx-auto max-w-[1540px] border-x border-black/10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#FF2D2D]">{content.servicesEyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[.94] tracking-[-.055em] sm:text-6xl">{content.servicesTitle}</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-black/52">{content.servicesBody}</p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {SERVICE_GROUPS.map((service) => (
              <a
                key={service.title}
                href={service.href}
                className="group overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_16px_50px_rgba(0,0,0,.05)] transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_24px_70px_rgba(0,0,0,.10)]"
              >
                <div className="relative h-64 overflow-hidden bg-[#111] sm:h-72">
                  <SitePhoto
                    category={service.category}
                    fallbackCategory={service.fallbackCategory}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                  <p className="absolute bottom-5 left-5 text-[10px] font-semibold uppercase tracking-[.25em] text-white/80">{service.eyebrow}</p>
                </div>
                <div className="p-7 sm:p-8">
                  <h3 className="text-3xl font-semibold leading-[1] tracking-[-.045em]">{service.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-black/52">{service.body}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-black">
                    {service.link}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] text-black">
        <div className="mx-auto max-w-[1540px] border-x border-black/10 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[.35fr_1.65fr]">
            <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#FF2D2D]">{content.introEyebrow}</p>
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
              <div className="rounded-[30px] bg-[#111318] p-8 text-white">
                <p className="text-[10px] uppercase tracking-[.27em] text-[#FF2D2D]">Clear communication</p>
                <p className="mt-6 text-3xl font-semibold leading-[1.02] tracking-[-.045em]">Send the vehicle details. Get a clear answer. Get it handled.</p>
                <p className="mt-5 text-sm leading-7 text-white/45">No need to guess which package fits. Vehicle size, condition, photos, and the work requested help determine what makes sense before the appointment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] text-black">
        <div className="mx-auto grid max-w-[1540px] border-x border-black/10 lg:grid-cols-2">
          <div className="min-h-[520px]"><SitePhoto category="home-story" className="h-full min-h-[520px] w-full object-cover" /></div>
          <div className="flex flex-col justify-center border-t border-black/10 px-5 py-16 sm:px-8 lg:border-l lg:border-t-0 lg:px-12">
            <p className="text-[10px] uppercase tracking-[.28em] text-[#FF2D2D]">{content.storyEyebrow}</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[.96] tracking-[-.055em] sm:text-6xl">{content.storyTitle}</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-black/52">{content.storyBody}</p>
            <div className="mt-8 flex gap-3">
              <a href="/about" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">About Car Dash</a>
              <a href="/faq" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold">FAQ</a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0D0D0D]">
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[.28em] text-[#FF2D2D]">{content.galleryEyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.galleryTitle}</h2>
            </div>
            <a href="/gallery" className="hidden text-sm text-white/45 transition hover:text-white sm:block">Full gallery →</a>
          </div>
          <div className="mt-10"><DynamicGallery limit={6} /></div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0D0D0D]">
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.28em] text-[#FF2D2D]">{content.reviewsEyebrow}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{content.reviewsTitle}</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">{content.reviewsBody}</p>
            </div>
            <a href="/reviews" className="text-sm text-white/45 transition hover:text-white">See the review page →</a>
          </div>
          <ReviewCards />
        </div>
      </section>

      <section className="bg-[#FFFFFF] text-black">
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
