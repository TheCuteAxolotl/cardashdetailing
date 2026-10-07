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

    fetch(`/api/images?${query.toString()}`, { cache: "no-store" })
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
      <div className="gallery-editorial grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[235px] lg:grid-cols-3">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={`gallery-tile group relative overflow-hidden text-left ${index === 0 ? "sm:row-span-2 lg:col-span-2 lg:row-span-2" : index === 1 ? "lg:row-span-2" : ""}`}
            aria-label={`Open ${item.title}`}
          >
            <MediaVisual item={item} thumbnail className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.045]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.04),transparent_48%,rgba(0,0,0,.78))] transition duration-500 group-hover:bg-[linear-gradient(180deg,rgba(0,0,0,.02),transparent_42%,rgba(0,0,0,.84))]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-white/52">{item.category.replaceAll("-", " ")}</p>
                <h3 className="mt-1 truncate text-lg font-semibold tracking-[-.02em] text-white">{item.title}</h3>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/18 bg-black/20 text-sm text-white/78 opacity-80 backdrop-blur-md transition duration-300 group-hover:rotate-[-8deg] group-hover:bg-white group-hover:text-black">↗</span>
            </div>
          </button>
        ))}
      </div>
      <MediaLightbox items={visible} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
