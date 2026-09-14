"use client";

import { useEffect, useMemo, useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function DynamicGallery({ limit }: { limit?: number }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const query = new URLSearchParams();
    ["gallery", "before-after", "portfolio"].forEach((category) => query.append("category", category));
    query.set("limit", String(typeof limit === "number" ? Math.max(limit, 1) : 30));

    fetch(`/api/images?${query.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const visible = useMemo(() => (typeof limit === "number" ? items.slice(0, limit) : items), [items, limit]);

  if (loading) return <div className="h-72 animate-pulse rounded-[24px] border border-black/8 bg-black/[.04]" />;

  if (!visible.length) {
    return <div className="rounded-[24px] border border-dashed border-black/15 bg-white p-8 text-sm text-black/45">Gallery photos and videos will show here after they’re added from the Owner Dashboard.</div>;
  }

  return (
    <>
      <div className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={`group relative overflow-hidden rounded-[22px] text-left ${index === 0 ? "sm:row-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
            aria-label={`Open ${item.title}`}
          >
            <MediaVisual item={item} thumbnail className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-[10px] uppercase tracking-[.22em] text-[#FF2D2D]">{item.category.replaceAll("-", " ")}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
            </div>
          </button>
        ))}
      </div>
      <MediaLightbox items={visible} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
