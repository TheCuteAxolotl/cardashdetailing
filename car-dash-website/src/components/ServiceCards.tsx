"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string | null;
};

type Props = {
  limit?: number;
  variant?: "dark" | "light";
};

function serviceLines(description: string) {
  return description
    .split(/\n|•/)
    .map((line) => line.trim().replace(/^[-–—✓✔]+\s*/, ""))
    .filter(Boolean);
}

export default function ServiceCards({ limit, variant = "dark" }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load services");
        return response.json();
      })
      .then((data: Service[]) => setServices(limit ? data.slice(0, limit) : data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const isLight = variant === "light";

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].slice(0, limit || 3).map((item) => (
          <div
            key={item}
            className={`h-[430px] animate-pulse rounded-[1.6rem] border ${
              isLight ? "border-black/10 bg-black/5" : "border-white/10 bg-white/[0.035]"
            }`}
          />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className={`rounded-[1.8rem] border border-dashed px-7 py-10 text-center ${
        isLight ? "border-black/15 bg-black/[0.025] text-black" : "border-white/15 bg-white/[0.025] text-white"
      }`}>
        <p className="text-lg font-black">I’m updating the service menu right now.</p>
        <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
          Send me your vehicle and what you want done. I’ll get back to you with a price.
        </p>
        <Link href="/contact" className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-500">
          Get a Quote
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service, index) => {
        const lines = serviceLines(service.description);
        const visibleLines = lines.slice(0, 7);
        const hasMore = lines.length > visibleLines.length;

        return (
          <article
            key={service.id}
            className={`group relative flex min-h-[450px] flex-col overflow-hidden rounded-[1.6rem] border p-7 transition duration-300 hover:-translate-y-1 ${
              isLight
                ? "border-black/10 bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,.08)] hover:border-red-500/35"
                : "border-white/10 bg-[#0b0b0b] text-white hover:border-red-500/45"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />

            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-red-600/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
                Detail Package
              </span>
              <span className={`text-xs font-black ${isLight ? "text-neutral-300" : "text-neutral-700"}`}>
                0{index + 1}
              </span>
            </div>

            <h3 className="mt-5 text-2xl font-black tracking-tight">{service.title}</h3>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-black tracking-[-0.05em]">${service.price}</span>
              <span className={`pb-1 text-[10px] font-black uppercase tracking-[0.18em] ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>
                price
              </span>
            </div>

            <div className={`my-5 h-px ${isLight ? "bg-black/10" : "bg-white/10"}`} />

            <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.22em] ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>
              What’s included
            </p>

            <ul className="flex-1 space-y-2.5">
              {visibleLines.map((line, lineIndex) => (
                <li key={`${service.id}-${lineIndex}`} className={`flex gap-2.5 text-sm leading-6 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                  <span>{line}</span>
                </li>
              ))}
              {hasMore && (
                <li className={`text-xs font-bold ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>
                  + more included
                </li>
              )}
            </ul>

            <Link
              href={`/contact?service=${encodeURIComponent(service.title)}`}
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-red-500"
            >
              Book This Package
            </Link>
          </article>
        );
      })}
    </div>
  );
}
