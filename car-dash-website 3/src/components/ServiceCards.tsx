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

export default function ServiceCards({ limit }: { limit?: number }) {
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

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].slice(0, limit || 3).map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-[2rem] border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center">
        <p className="text-lg font-semibold text-white">Packages are being updated.</p>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Need something done now? Send a booking request and tell me what your vehicle needs.
        </p>
        <Link href="/contact" className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500">
          Book Now
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <article
          key={service.id}
          className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] p-7 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-red-500/60"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-500">Car Dash Package</p>
          <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{service.title}</h3>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-sm font-semibold text-neutral-500">from</span>
            <span className="text-4xl font-black tracking-tight text-white">${service.price}</span>
          </div>
          <p className="mt-5 min-h-24 whitespace-pre-line text-sm leading-7 text-neutral-300">{service.description}</p>
          <Link
            href="/contact"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-red-500"
          >
            Book Now
          </Link>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Final pricing can vary if the vehicle needs extra work. I’ll confirm everything with you first.
          </p>
        </article>
      ))}
    </div>
  );
}
