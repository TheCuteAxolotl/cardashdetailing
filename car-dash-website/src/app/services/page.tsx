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

const carAddOns = [
  ["Pet hair removal", "$39"],
  ["Seat shampoo", "$49"],
  ["Carpet extraction", "$59"],
  ["Heavy stain treatment", "$69"],
  ["Leather protection", "$39"],
  ["Odor treatment", "$49"],
  ["Engine bay detail", "$49"],
  ["Iron decontamination", "$45"],
  ["Clay bar treatment", "$59"],
  ["Hand wax", "$49"],
  ["Ceramic sealant", "$79"],
  ["Wheel coating", "$89"],
  ["Exterior trim protection", "$45"],
  ["Bug and tar removal", "$35"],
  ["Underbody cleaning", "$30"],
] as const;

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

function isMarineService(service: Service) {
  return `${service.category} ${service.subcategory} ${service.title}`.toLowerCase().includes("marine");
}

function price(service: Service) {
  if (service.pricingType === "fixed") return `$${service.price}`;
  if (service.pricingType === "starting") return `Starting at $${service.startingPrice ?? service.price}`;
  if (service.pricingType === "range") return `$${service.startingPrice ?? service.price}–$${service.maxPrice ?? service.startingPrice ?? service.price}`;
  return "Custom quote";
}

function ServiceGrid({ services }: { services: Service[] }) {
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <article id={service.id} key={service.id} className="group scroll-mt-32 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.12),rgba(255,255,255,.02))] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#FF2D2D]/35 hover:bg-[#FF2D2D]/[.035]">
          <p className="text-xs text-white/35">{service.subcategory}</p>
          <h3 className="mt-2 text-2xl font-semibold">{service.title}</h3>
          <p className="mt-4 min-h-20 text-sm leading-6 text-white/45">{service.description}</p>
          <p className="mt-5 text-xl font-semibold">{price(service)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {service.pricingType === "fixed" && service.price > 0 ? (
              <a href={`/contact?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#FF2D2D] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Book · ${service.price.toFixed(0)}</a>
            ) : service.pricingType === "quote" ? (
              <a href={`/quote?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#FF2D2D] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get exact quote</a>
            ) : (
              <a href={`/estimate?service=${encodeURIComponent(service.id)}`} className="rounded-full bg-[#FF2D2D] px-4 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get estimate</a>
            )}
            <a href={`/quote?service=${encodeURIComponent(service.id)}`} className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2.5 text-sm">Chat</a>
          </div>
        </article>
      ))}
    </div>
  );
}

function AddOnList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111318]">
      {items.map(([name, cost], index) => (
        <div key={name} className={`flex items-center justify-between gap-5 px-5 py-4 sm:px-6 ${index !== items.length - 1 ? "border-b border-white/8" : ""}`}>
          <span className="text-sm text-white/72">{name}</span>
          <span className="shrink-0 text-sm font-semibold text-[#FF2D2D]">{cost}</span>
        </div>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.json())
      .then((data) => setItems(Array.isArray(data) ? data.filter((item: Service) => item.active) : []));
  }, []);

  const carItems = items.filter((item) => !isMarineService(item));
  const marineItems = items.filter(isMarineService);
  const carCategories = [...new Set(carItems.map((item) => item.category))];
  const marineCategories = [...new Set(marineItems.map((item) => item.category))];

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-24 text-center">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl accent-rule" />
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Services</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">Auto detailing and marine detailing, clearly separated.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-white/45">Start with the vehicle type below, then choose a package, add-on, estimate, or exact quote.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#car-detailing" className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] shadow-[0_0_32px_rgba(255,45,45,.12)]">Car Detailing</a>
          <a href="#marine-detailing" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3 font-semibold">Marine Detailing</a>
          <a href="/quote" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3 font-semibold">Chat to a Specialist</a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <section id="car-detailing" className="scroll-mt-32">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Car Detailing</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Interior, exterior, correction, and protection for cars, SUVs, and trucks.</h2>
            <p className="mt-5 text-sm leading-7 text-white/45">Car services stay together here. Marine services have their own section farther down the page so the pricing and options do not get mixed together.</p>
          </div>

          {carCategories.length ? carCategories.map((category) => (
            <div key={category} className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[.24em] text-white/35">{category}</p>
              <ServiceGrid services={carItems.filter((item) => item.category === category)} />
            </div>
          )) : <p className="text-white/40">Car detailing services are being updated.</p>}
        </section>

        <section id="car-add-ons" className="scroll-mt-32 border-t border-white/10 pt-16">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Car Detailing Add-Ons</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-.05em] sm:text-5xl">Add only what the vehicle actually needs.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">These can be added to compatible car-detailing services. Heavier contamination or unusually large vehicles may need a custom quote before work begins.</p>
              <div className="mt-6 flex flex-wrap gap-3"><a href="/contact" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Book a car detail</a><a href="/quote" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">Ask about add-ons</a></div>
            </div>
            <AddOnList items={carAddOns} />
          </div>
        </section>
      </div>

      <section id="marine-detailing" className="scroll-mt-32 border-y border-[#FF2D2D]/15 bg-[linear-gradient(180deg,rgba(74,85,104,.12),rgba(13,13,13,1))]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Marine Detailing</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">A separate marine service menu built around boat size, condition, and access.</h2>
            <p className="mt-5 text-sm leading-7 text-white/45">Marine work is priced separately from automotive detailing. Per-foot work, oxidation, gelcoat correction, canvas, cabins, trailers, and coatings are handled here.</p>
          </div>

          {marineCategories.length ? marineCategories.map((category) => (
            <div key={category} className="mt-12">
              <p className="text-xs font-bold uppercase tracking-[.24em] text-white/35">{category}</p>
              <ServiceGrid services={marineItems.filter((item) => item.category === category)} />
            </div>
          )) : <p className="mt-8 text-white/40">Marine services are being updated. The add-on menu below is still available for planning and quote requests.</p>}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <section id="marine-add-ons" className="scroll-mt-32 pt-4">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Marine Add-Ons</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-.05em] sm:text-5xl">Build the boat detail around what it actually needs.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">Per-foot options make heavier marine work easier to price without forcing every boat into the same package.</p>
            </div>

            <div>
              <AddOnList items={marineAddOns} />

              <div className="mt-6 rounded-[26px] border border-[#FF2D2D]/20 bg-[#FF2D2D]/[.055] p-6">
                <p className="text-xs font-bold uppercase tracking-[.24em] text-[#FF2D2D]">Marine pricing note</p>
                <p className="mt-4 text-sm leading-7 text-white/58">Marine detailing prices are based on the boat&apos;s overall length, condition, oxidation level and accessibility. Excessive mold, mildew, staining, oxidation, waterline buildup and personal-item removal may cost extra. The bottom of the hull, wet sanding and ceramic coating require an inspection. Water and electrical access may be required.</p>
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
