"use client";

import { useEffect, useMemo, useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

type Props = {
  categories: string[];
  theme?: "light" | "dark";
  eyebrow?: string;
  title?: string;
  compact?: boolean;
  maxPreview?: number;
  className?: string;
};

export default function PageMediaBand({
  categories,
  theme = "light",
  eyebrow,
  title,
  compact = false,
  maxPreview = 6,
  className = "",
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const categoryKey = categories.join("|");

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams();
    categories.forEach((category) => query.append("category", category));
    query.set("limit", "50");

    fetch(`/api/images?${query.toString()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((media) => {
        if (!cancelled) setItems(Array.isArray(media) ? media : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => items.slice(0, Math.max(1, maxPreview)), [items, maxPreview]);
  if (!visible.length) return null;

  const dark = theme === "dark";
  const border = dark ? "border-white/10" : "border-black/10";

  return (
    <>
      <div className={className}>
        {(eyebrow || title) && (
          <div className="mb-5">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">{eyebrow}</p>}
            {title && <h2 className={`mt-2 text-3xl font-semibold tracking-[-.04em] ${dark ? "text-white" : "text-[#111]"}`}>{title}</h2>}
          </div>
        )}
        <div className={`grid gap-3 ${visible.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
          {visible.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className={`${index === 0 && visible.length >= 3 && !compact ? "col-span-2 row-span-2" : ""} group relative overflow-hidden rounded-[22px] border ${border} bg-black text-left ${compact ? "min-h-36" : "min-h-48"}`}
              aria-label={`Open ${item.title}`}
            >
              <MediaVisual item={item} thumbnail className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] ${compact ? "min-h-36 max-h-56" : "min-h-48"}`} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 text-xs font-semibold text-white">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
      <MediaLightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
