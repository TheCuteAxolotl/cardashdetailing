"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  startingPrice: number | null;
  maxPrice: number | null;
  pricingType: string;
  category: string;
  subcategory: string;
  active: boolean;
};

const marineAddOns = [
  ["Heavy oxidation removal", "$10–$20/ft"],
  ["Wet sanding and gelcoat restoration", "Custom quote"],
  ["Pontoon aluminum acid wash", "$12/ft"],
  ["Carpet extraction", "$6/ft"],
  ["Mold and mildew treatment", "$5–$10/ft"],
  ["Bimini or canvas cleaning", "$100+"],
  ["Canvas waterproofing", "$150+"],
  ["Isinglass cleaning and polishing", "$100+"],
  ["Metal and aluminum polishing", "$8/ft"],
  ["Interior cabin detailing", "$150+"],
  ["Engine compartment cleaning", "$75+"],
  ["Trailer cleaning", "$75+"],
  ["Synthetic deck sealant", "Custom quote"],
] as const;

const twentyFootExamples = [
  ["Maintenance", "$300"],
  ["Complete detail", "$600"],
  ["Correction", "$900"],
  ["Ceramic", "$1,300+"],
] as const;

function price(service: Service) {
  if (service.pricingType === "fixed") return `$${service.price}`;
  if (service.pricingType === "starting") return `Starting at $${service.startingPrice}`;
  if (service.pricingType === "range") return `$${service.startingPrice}–$${service.maxPrice}`;
  return "Custom quote";
}

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.json())
      .then((data) => setItems(Array.isArray(data) ? data.filter((item: Service) => item.active) : []));
  }, []);

  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-24 text-center">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl cyan-rule" />
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#00F2FE]">Services</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
          Choose the service. Choose how you want the price.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-white/45">
          Book fixed-price work, get a quick planning estimate, or talk directly with a specialist for an exact quote.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/estimate" className="rounded-full bg-[#00F2FE] px-6 py-3 font-semibold text-[#0D0D0D] shadow-[0_0_32px_rgba(0,242,254,.12)]">Get an Estimate</a>
          <a href="/quote" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3 font-semibold">Chat to a Specialist</a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-14">
        {categories.length ? categories.map((category) => (
          <section key={category} className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#00F2FE]">{category}</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.filter((item) => item.category === category).map((service) => (
                <article id={service.id} key={service.id} className="group rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.12),rgba(255,255,255,.02))] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#00F2FE]/35 hover:bg-[#00F2FE]/[.035]">
                  <p className="text-xs text-white/35">{service.subcategory}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{service.title}</h2>
                  <p className="mt-4 min-h-20 text-sm leading-6 text-white/45">{service.description}</p>
                  <p className="mt-5 text-xl font-semibold">{price(service)}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {service.pricingType === "fixed" && service.price > 0 ? (
                      <a href={`/contact?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#00F2FE] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Book · ${service.price.toFixed(0)}</a>
                    ) : service.pricingType === "quote" ? (
                      <a href={`/quote?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#00F2FE] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get exact quote</a>
                    ) : (
                      <a href={`/estimate?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#00F2FE] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get estimate</a>
                    )}
                    <a href={`/quote?service=${encodeURIComponent(service.id)}`} className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2.5 text-sm">Chat</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )) : <p className="text-white/40">Services are being updated.</p>}

        <section id="marine-add-ons" className="scroll-mt-32 border-t border-white/10 pt-16">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold uppercase tracking-[.28em] text-[#00F2FE]">Marine Add-Ons</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-.05em] sm:text-5xl">Build the boat detail around what it actually needs.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">Per-foot options make heavier marine work easier to price without forcing every boat into the same package.</p>
            </div>

            <div>
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111318]">
                {marineAddOns.map(([name, cost], index) => (
                  <div key={name} className={`flex items-center justify-between gap-5 px-5 py-4 sm:px-6 ${index !== marineAddOns.length - 1 ? "border-b border-white/8" : ""}`}>
                    <span className="text-sm text-white/72">{name}</span>
                    <span className="shrink-0 text-sm font-semibold text-[#00F2FE]">{cost}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[26px] border border-[#00F2FE]/20 bg-[#00F2FE]/[.055] p-6">
                <p className="text-xs font-bold uppercase tracking-[.24em] text-[#00F2FE]">Marine pricing note</p>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  Marine detailing prices are based on the boat&apos;s overall length, condition, oxidation level and accessibility. Excessive mold, mildew, staining, oxidation, waterline buildup and personal-item removal may cost extra. The bottom of the hull, wet sanding and ceramic coating require an inspection. Water and electrical access may be required.
                </p>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-[.24em] text-white/35">Typical 20-foot boat · approximate starting guide</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {twentyFootExamples.map(([label, cost]) => (
                    <div key={label} className="rounded-[22px] border border-white/10 bg-white/[.025] p-5">
                      <p className="text-xs text-white/38">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{cost}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-white/30">These examples are planning figures, not guaranteed quotes. Final marine pricing depends on inspection and condition.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
