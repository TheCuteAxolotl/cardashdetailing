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
  active: boolean;
  image: string | null;
};

type Props = { limit?: number; variant?: "dark" | "light" };

function lines(value: string) {
  return value
    .split(/\n|•/)
    .map((item) => item.trim().replace(/^[-–—✓✔]+\s*/, ""))
    .filter(Boolean);
}

function priceLabel(service: Service) {
  if (service.pricingType === "fixed") return `$${service.price.toFixed(0)}`;
  if (service.pricingType === "starting") return `From $${service.startingPrice ?? service.price}`;
  if (service.pricingType === "range") return `$${service.startingPrice ?? service.price}–$${service.maxPrice ?? service.startingPrice ?? service.price}`;
  return "Quote";
}

export default function ServiceCards({ limit, variant = "dark" }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const active = Array.isArray(data) ? data.filter((service: Service) => service.active) : [];
        setServices(limit ? active.slice(0, limit) : active);
      })
      .finally(() => setLoading(false));
  }, [limit]);

  const light = variant === "light";

  if (loading) {
    return (
      <div className="grid gap-px overflow-hidden rounded-[24px] bg-white/10 lg:grid-cols-3">
        {[0, 1, 2].map((index) => <div key={index} className="h-96 animate-pulse bg-[#111]" />)}
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className={`rounded-[24px] border p-8 ${light ? "border-black/10 bg-black/[.03]" : "border-white/10 bg-white/[.03]"}`}>
        <p className="text-lg font-semibold">Service menu is being updated.</p>
        <a href="/quote" className="mt-5 inline-block text-sm text-[#FF2D2D]">Chat to a Specialist →</a>
      </div>
    );
  }

  return (
    <div className={`grid gap-px overflow-hidden rounded-[28px] ${light ? "bg-black/10" : "bg-white/10"} lg:grid-cols-3`}>
      {services.map((service, index) => {
        const fixed = service.pricingType === "fixed" && service.price > 0;
        return (
          <article key={service.id} className={`group flex min-h-[430px] flex-col p-7 sm:p-8 ${light ? "bg-[#FFFFFF] text-black" : "bg-[#111318] text-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[.23em] text-[#FF2D2D]">Service 0{index + 1}</span>
              <span className={`text-xs ${light ? "text-black/35" : "text-white/35"}`}>{priceLabel(service)}</span>
            </div>
            <h3 className="mt-10 text-3xl font-semibold tracking-[-.045em]">{service.title}</h3>
            <div className={`my-6 h-px ${light ? "bg-black/10" : "bg-white/10"}`} />
            <ul className="flex-1 space-y-3">
              {lines(service.description).slice(0, 7).map((item, itemIndex) => (
                <li key={itemIndex} className={`flex gap-3 text-sm leading-6 ${light ? "text-black/50" : "text-white/43"}`}>
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#FF2D2D]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className={`mt-8 flex items-center justify-between gap-3 border-t pt-5 ${light ? "border-black/10" : "border-white/10"}`}>
              <a
                href={fixed ? `/contact?service=${encodeURIComponent(service.id)}` : `/quote?service=${encodeURIComponent(service.id)}`}
                className="text-sm font-semibold"
              >
                {fixed ? `Book · $${service.price.toFixed(0)}` : "Get exact quote"}
              </a>
              {!fixed && service.pricingType !== "quote" && (
                <a href={`/estimate?service=${encodeURIComponent(service.id)}`} className="text-xs text-[#FF2D2D]">Estimate →</a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
