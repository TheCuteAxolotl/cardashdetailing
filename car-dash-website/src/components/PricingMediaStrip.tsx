"use client";

import { useEffect, useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function PricingMediaStrip({ category, className = "" }: { category: string; className?: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const query = new URLSearchParams();
    query.append("category", category);
    query.set("limit", "8");
    fetch(`/api/images?${query.toString()}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((media) => setItems(Array.isArray(media) ? media : []))
      .catch(() => setItems([]));
  }, [category]);

  if (!items.length) return null;

  return (
    <>
      <div className={`grid gap-3 ${items.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} ${className}`}>
        {items.slice(0, 4).map((item, index) => (
          <button key={item.id} type="button" onClick={() => setOpenIndex(index)} className={`${index === 0 && items.length > 2 ? "col-span-2 row-span-2" : ""} group relative min-h-44 overflow-hidden rounded-[24px] border border-white/10 bg-black text-left`} aria-label={`Open ${item.title}`}>
            <MediaVisual item={item} thumbnail className="h-full min-h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-xs font-semibold text-white">{item.title}</span>
          </button>
        ))}
      </div>
      <MediaLightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
