"use client";

import { useEffect, useState } from "react";
import PricingMediaStrip from "@/components/PricingMediaStrip";

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
  ["Wet sanding + gelcoat restoration", "Custom quote"],
  ["Pontoon aluminum acid wash", "$12/ft"],
  ["Carpet extraction", "$6/ft"],
  ["Mold + mildew treatment", "$5–$10/ft"],
  ["Bimini / canvas cleaning", "$100+"],
  ["Canvas waterproofing", "$150+"],
  ["Interior cabin detailing", "$150+"],
  ["Engine compartment cleaning", "$75+"],
  ["Trailer cleaning", "$75+"],
] as const;

function isMarineService(service: Service) {
  return `${service.category} ${service.subcategory} ${service.title}`.toLowerCase().includes("marine");
}

function priceLabel(service: Service) {
  if (service.pricingType === "fixed" && service.price > 0) return `$${service.price.toFixed(0)}`;
  if (service.pricingType === "starting") return `From $${Number(service.startingPrice ?? service.price).toFixed(0)}`;
  if (service.pricingType === "range") {
    const low = Number(service.startingPrice ?? service.price);
    const high = Number(service.maxPrice ?? service.startingPrice ?? service.price);
    return low && high ? `$${low.toFixed(0)}–$${high.toFixed(0)}` : "Custom quote";
  }
  return "Custom quote";
}

export default function MarineDetailingPage() {
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data.filter((item: Service) => item.active && isMarineService(item)) : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Marine detailing</p><h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Boat cleaning, correction, and protection.</h1></div>
          <div><p className="max-w-2xl text-base leading-7 text-black/52">Marine pricing depends a lot on length, condition, oxidation, access, and the work you want done. Current marine services and prices are listed below.</p><div className="mt-5 flex flex-wrap gap-3"><a href="#marine-prices" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">See prices</a><a href="/quote" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-bold text-white">Marine quote</a><a href="/#book" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Book</a></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-10"><PricingMediaStrip category="marine-services" /></section>

      <section id="marine-prices" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Current marine services</p><h2 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Prices without the maze.</h2></div>

        <div className="overflow-hidden rounded-[26px] border border-black/10 bg-white">
          {items.length ? items.map((service, index) => {
            const canBook = service.pricingType === "fixed" && service.price > 0;
            const href = canBook ? `/?service=${encodeURIComponent(service.id)}#book` : `/quote?service=${encodeURIComponent(service.id)}`;
            return (
              <div key={service.id} className={`grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6 ${index ? "border-t border-black/8" : ""}`}>
                <div><h3 className="text-lg font-semibold">{service.title}</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-black/45">{service.description}</p></div>
                <strong className="text-xl">{priceLabel(service)}</strong>
                <a href={href} className={`rounded-full px-4 py-2.5 text-center text-xs font-bold ${canBook ? "bg-[#111] text-white" : "border border-black/12"}`}>{canBook ? "Book" : "Get quote"}</a>
              </div>
            );
          }) : <div className="px-6 py-8 text-sm text-black/45">We’re updating the marine service list. You can still send a marine quote request.</div>}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Marine add-ons</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Extra work when the boat needs it.</h2><p className="mt-4 text-sm leading-6 text-black/48">Per-foot pricing is common because a 20-foot boat and a 30-foot boat are completely different jobs.</p></div>
          <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white">{marineAddOns.map(([name, cost], index) => <div key={name} className={`flex items-center justify-between gap-5 px-5 py-4 ${index ? "border-t border-black/8" : ""}`}><span className="text-sm text-black/58">{name}</span><strong className="shrink-0 text-sm">{cost}</strong></div>)}</div>
        </div>

        <div className="mt-8 rounded-[24px] border border-black/10 bg-[#111] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#FF2D2D]">Pricing note</p><p className="mt-3 max-w-4xl text-sm leading-7 text-white/48">Final marine pricing can change with oxidation, mold, waterline buildup, accessibility, wet sanding, coating prep, and the overall condition of the boat. We confirm anything outside the listed service before starting.</p></div>
      </section>
    </main>
  );
}
