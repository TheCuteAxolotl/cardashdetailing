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
  const [loading, setLoading] = useState(true);
  const categoryKey = categories.join("|");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => items.slice(0, Math.max(1, maxPreview)), [items, maxPreview]);

  if (loading) {
    return (
      <div className={className}>
        {(eyebrow || title) && (
          <div className="mb-5">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7B5C4B]">{eyebrow}</p>}
            {title && <h2 className={`mt-2 text-3xl font-semibold tracking-[-.04em] ${theme === "dark" ? "text-[#F7F5F2]" : "text-[#171411]"}`}>{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className={`${slot === 0 && !compact ? "col-span-2 row-span-2" : ""} ${compact ? "min-h-36" : "min-h-48"} animate-pulse rounded-[22px] border ${theme === "dark" ? "border-[#F7F5F2]/10 bg-[#C0AB9A]/10" : "border-[#C0AB9A]/35 bg-[linear-gradient(135deg,#EFE8E2,#F7F5F2)]"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!visible.length) return null;

  const dark = theme === "dark";
  const border = dark ? "border-[#F7F5F2]/10" : "border-[#C0AB9A]/35";

  return (
    <>
      <div className={className}>
        {(eyebrow || title) && (
          <div className="mb-5">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7B5C4B]">{eyebrow}</p>}
            {title && <h2 className={`mt-2 text-3xl font-semibold tracking-[-.04em] ${dark ? "text-[#F7F5F2]" : "text-[#171411]"}`}>{title}</h2>}
          </div>
        )}
        <div className={`page-media-grid grid gap-3 ${visible.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
          {visible.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className={`${index === 0 && visible.length >= 3 && !compact ? "col-span-2 row-span-2" : ""} media-band-tile group relative overflow-hidden border ${border} bg-[#171411] text-left ${compact ? "min-h-36" : "min-h-48"}`}
              aria-label={`Open ${item.title}`}
            >
              <MediaVisual item={item} thumbnail className={`h-full w-full object-cover transition duration-[800ms] ease-out group-hover:scale-[1.04] ${compact ? "min-h-36 max-h-56" : "min-h-48"}`} />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#171411]/88 to-transparent px-4 pb-4 pt-12 text-xs font-semibold text-[#F7F5F2]"><span className="truncate">{item.title}</span><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/16 bg-black/15 text-[11px] opacity-80 backdrop-blur-sm transition group-hover:bg-white group-hover:text-black">↗</span></span>
            </button>
          ))}
        </div>
      </div>
      <MediaLightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
