"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  title: string;
  category: string;
};

export default function DynamicGallery({ limit }: { limit?: number }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/images", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load gallery"))))
      .then((data) => {
        if (!cancelled) setImages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const filtered = images.filter((img) => img.category !== "hero");
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [images, limit]);

  if (loading) {
    return <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-8 text-sm text-neutral-500">Loading recent work…</div>;
  }

  if (!visible.length) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/[0.025] p-8 text-sm text-neutral-400">
        Your gallery photos will show here after you add them from the Owner Dashboard.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((image) => (
        <article key={image.id} className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d0d0d]">
          <div className="relative overflow-hidden">
            <img src={image.url} alt={image.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          </div>
          <div className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500">{image.category.replaceAll("-", " ")}</p>
            <h3 className="mt-2 text-lg font-black text-white">{image.title}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}
