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
    return <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">Loading recent work…</div>;
  }

  if (!visible.length) {
    return (
      <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
        Gallery photos will appear here after they are added from the owner dashboard.
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((image) => (
        <article key={image.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <img src={image.url} alt={image.title} className="h-64 w-full object-cover" loading="lazy" />
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{image.category.replaceAll("-", " ")}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{image.title}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}
