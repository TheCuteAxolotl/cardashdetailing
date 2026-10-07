"use client";

import { useEffect, useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function PricingMediaStrip({
  category,
  className = "",
  theme = "light",
}: {
  category: string;
  className?: string;
  theme?: "light" | "dark";
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    query.append("category", category);
    query.set("limit", "50");
    fetch(`/api/images?${query.toString()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((media) => setItems(Array.isArray(media) ? media : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  const dark = theme === "dark";

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}>
        {[0, 1, 2, 3].map((slot) => (
          <div
            key={slot}
            className={`${slot === 0 ? "col-span-2 row-span-2" : ""} min-h-44 animate-pulse rounded-[24px] border ${dark ? "border-[#F7F5F2]/10 bg-[#C0AB9A]/10" : "border-[#C0AB9A]/35 bg-[linear-gradient(135deg,#EFE8E2,#F7F5F2)]"}`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <>
      <div className={`grid gap-3 ${items.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} ${className}`}>
        {items.slice(0, 4).map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={`${index === 0 && items.length > 2 ? "col-span-2 row-span-2" : ""} media-band-tile group relative min-h-44 overflow-hidden border ${dark ? "border-[#F7F5F2]/10" : "border-[#C0AB9A]/35"} bg-[#171411] text-left`}
            aria-label={`Open ${item.title}`}
          >
            <MediaVisual item={item} thumbnail className="h-full min-h-44 w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.045]" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#171411]/88 to-transparent px-4 pb-4 pt-10 text-xs font-semibold text-[#F7F5F2]"><span className="truncate">{item.title}</span><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/16 bg-black/15 text-[11px] opacity-80 backdrop-blur-sm transition group-hover:bg-white group-hover:text-black">↗</span></span>
          </button>
        ))}
      </div>
      <MediaLightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
