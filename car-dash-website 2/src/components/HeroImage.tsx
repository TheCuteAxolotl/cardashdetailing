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
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-white p-8 text-center shadow-inner">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Your work belongs here</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">Add a Hero photo from the owner dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <img src={image.url} alt={image.title} className="h-[430px] w-full object-cover" />
      <div className="border-t border-slate-200 bg-white px-5 py-4">
        <p className="text-sm font-semibold text-slate-950">{image.title}</p>
      </div>
    </div>
  );
}
