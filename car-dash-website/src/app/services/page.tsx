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
  const carCategories = [...new Set(carItems.map((item) => item.category))];

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-24 text-center">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl accent-rule" />
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Car Detailing</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">Car detailing services for interiors, exteriors, correction, and protection.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-white/45">This page is only for cars, SUVs, and trucks. Marine detailing now has its own dedicated page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#car-detailing" className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] shadow-[0_0_32px_rgba(255,45,45,.12)]">Car Services</a>
          <a href="#car-add-ons" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3 font-semibold">Car Add-Ons</a>
          <a href="/marine-detailing" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3 font-semibold">Marine Detailing →</a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <section id="car-detailing" className="scroll-mt-32">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Car Detailing Services</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Choose the service that matches the vehicle, then add only what it needs.</h2>
            <p className="mt-5 text-sm leading-7 text-white/45">Automotive services and pricing stay here so they are never mixed with per-foot marine work.</p>
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
    </main>
  );
}
