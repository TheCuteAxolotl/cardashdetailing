"use client";

import { useEffect, useState } from "react";

type GalleryImage = { id: string; url: string; title: string; category: string };

export default function HeroImage() {
  const [image, setImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetch("/api/images", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((items: GalleryImage[]) => {
        const hero = items.find((item) => item.category === "hero") || items[0] || null;
        setImage(hero);
      })
      .catch(() => setImage(null));
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[3rem] bg-red-700/10 blur-3xl" />
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        {image ? (
          <div className="relative">
            <img
              src={image.url}
              alt={image.title}
              className="h-[430px] w-full object-cover sm:h-[510px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-400">Featured Work</p>
              <div className="mt-2 flex items-end justify-between gap-5">
                <h2 className="max-w-md text-xl font-black sm:text-2xl">{image.title}</h2>
                <span className="shrink-0 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur">
                  Car Dash
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-[430px] items-end overflow-hidden p-7 sm:h-[510px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(220,38,38,.20),transparent_38%),linear-gradient(145deg,#171717,#080808)]" />
            <div className="absolute inset-7 rounded-[1.4rem] border border-white/10" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-400">Homepage Hero</p>
              <p className="mt-2 max-w-sm text-2xl font-black">Upload a Hero photo from your Owner Dashboard and it’ll show here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
