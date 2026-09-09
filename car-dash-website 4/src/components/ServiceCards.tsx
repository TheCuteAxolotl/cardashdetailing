"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
};

export default function ServiceCards({ limit }: { limit?: number }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Could not load services");
        return data as Service[];
      })
      .then((data) => setServices(limit ? data.slice(0, limit) : data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].slice(0, limit || 3).map((item) => (
          <div key={item} className="h-[360px] animate-pulse rounded-[28px] border border-red-500/10 bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-[#151515] to-[#0a0a0a] p-9 text-center">
        <p className="text-2xl font-black text-white">Packages are being updated.</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-neutral-400">
          Need something done anyway? Send me your vehicle and what you want cleaned, corrected, or protected and I’ll get back to you.
        </p>
        <Link href="/contact" className="mt-6 inline-flex rounded-full bg-red-600 px-7 py-3.5 text-sm font-black text-white transition hover:bg-red-500">
          Book Now
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service, index) => (
        <article
          key={service.id}
          className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0d] p-7 shadow-[0_25px_70px_rgba(0,0,0,.35)] transition duration-300 hover:-translate-y-1 hover:border-red-500/50"
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-red-400">
              Package {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-600">Car Dash</span>
          </div>

          <h3 className="mt-6 text-3xl font-black tracking-tight text-white">{service.title}</h3>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black tracking-[-0.04em] text-white">${service.price}</span>
          </div>
          <p className="mt-5 min-h-28 whitespace-pre-line text-sm leading-7 text-neutral-300">{service.description}</p>

          <Link
            href={`/contact?service=${encodeURIComponent(service.title)}`}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-red-500"
          >
            Book Now
          </Link>
          <p className="mt-4 text-center text-[11px] leading-5 text-neutral-500">
            One package. One listed price. I’ll confirm everything with you before the appointment.
          </p>
        </article>
      ))}
    </div>
  );
}
