"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BOOKING_PRICING, BookingPricingConfig, parseBookingPricingConfig } from "@/lib/booking-pricing";

const pages = [
  { href: "/car-detailing-packages", eyebrow: "Complete Vehicle", title: "Car Detailing Packages", body: "Inside-and-out packages with fixed Coupe, Sedan, and Truck & SUV pricing." },
  { href: "/exterior-detailing", eyebrow: "Paint + Exterior", title: "Exterior Detailing", body: "Wash, decontamination, protection, and paint-enhancement packages with exact pricing." },
  { href: "/interior-detailing", eyebrow: "Cabin + Interior", title: "Interior Detailing", body: "Interior refresh, full detail, and deep-reset packages with exact pricing." },
] as const;

export default function ServicesPage() {
  const [bookingPricing, setBookingPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((response) => response.json())
      .then((content) => setBookingPricing(parseBookingPricingConfig(content?.bookingPricingConfig)))
      .catch(() => setBookingPricing(DEFAULT_BOOKING_PRICING));
  }, []);

  const carAddOns = bookingPricing.addOns.filter((item) => item.active);

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="border-b border-white/10 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Car Detailing</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[.92] tracking-[-.06em] sm:text-7xl">Three clear pricing pages. Pick the type of detail you actually need.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/50">Car packages, exterior work, and interior work now live on separate pages. Marine detailing stays completely separate.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {pages.map((page) => (
            <a key={page.href} href={page.href} className="group rounded-[30px] border border-white/10 bg-[#111318] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#FF2D2D]/35 hover:bg-[#FF2D2D]/[.035]">
              <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#FF2D2D]">{page.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em]">{page.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/45">{page.body}</p>
              <span className="mt-8 inline-block text-sm font-semibold text-white/70 group-hover:text-[#FF2D2D]">View pricing →</span>
            </a>
          ))}
        </div>
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[.02] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#FF2D2D]">Marine Detailing</p><h2 className="mt-2 text-2xl font-semibold">Boat services stay on their own dedicated page.</h2></div>
          <a href="/marine-detailing" className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold sm:mt-0">Marine Detailing →</a>
        </div>
      </section>

      <section id="car-add-ons" className="scroll-mt-32 border-t border-white/10 bg-[#111318]/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Car Detailing Add-Ons</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Add only what the vehicle actually needs.</h2>
            <p className="mt-5 text-sm leading-7 text-white/45">These can be added to compatible car-detailing services. Headlight Restoration uses the add-on price shown here when booked with a detail and ${bookingPricing.headlightStandalonePrice.toFixed(0)} when booked by itself. Heavier contamination or unusual restoration work may require a custom quote.</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="/contact" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Book a Detail</a><a href="/quote" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">Ask about add-ons</a></div>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0D0D0D]">
            {carAddOns.map((item, index) => <div key={item.id} className={`flex items-center justify-between gap-5 px-5 py-4 sm:px-6 ${index !== carAddOns.length - 1 ? "border-b border-white/8" : ""}`}><span className="text-sm text-white/70">{item.name}</span><span className="text-sm font-semibold text-[#FF2D2D]">${item.price.toFixed(0)}</span></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
