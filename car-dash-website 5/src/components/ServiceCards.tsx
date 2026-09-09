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
          <div key={item} className="h-80 animate-pulse rounded-[1.8rem] border border-white/10 bg-white/[0.035]" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] px-7 py-10 text-center">
        <p className="text-lg font-black">I’m updating the packages right now.</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-400">
          You can still send me your vehicle and what you want done. I’ll get back to you with a price.
        </p>
        <Link href="/contact" className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-500">
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
          className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-7 transition duration-300 hover:-translate-y-1 hover:border-red-500/45"
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-500">Detail Package</p>
            <span className="text-xs font-black text-neutral-600">0{index + 1}</span>
          </div>

          <h3 className="mt-5 text-2xl font-black tracking-tight">{service.title}</h3>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-black tracking-[-0.04em]">${service.price}</span>
            <span className="pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">starting</span>
          </div>

          <p className="mt-5 flex-1 whitespace-pre-line text-sm leading-7 text-neutral-300">{service.description}</p>

          <Link
            href={`/contact?service=${encodeURIComponent(service.title)}`}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-red-500"
          >
            Book Now
          </Link>
        </article>
      ))}
    </div>
  );
}
