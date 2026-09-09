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

  if (!image) {
    return (
      <div className="relative min-h-[430px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0c0c0c] p-8 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,.18),transparent_48%)]" />
        <div className="relative flex min-h-[365px] items-center justify-center rounded-[1.7rem] border border-white/10 bg-black/30 p-8 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Homepage Photo</p>
            <p className="mt-3 text-2xl font-black text-white">Upload a Hero photo from the Owner Dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#111] shadow-2xl shadow-black/40">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <img src={image.url} alt={image.title} className="h-[430px] w-full object-cover transition duration-700 group-hover:scale-[1.02]" />
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
        <p className="text-sm font-bold text-white">{image.title}</p>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Car Dash</span>
      </div>
    </div>
  );
}
