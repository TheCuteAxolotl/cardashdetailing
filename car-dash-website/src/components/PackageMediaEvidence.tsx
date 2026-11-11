"use client";

import { useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function PackageMediaEvidence({ packageMedia, features }: { packageMedia: MediaItem[]; features: string[] }) {
  const [lightboxItems, setLightboxItems] = useState<MediaItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const open = (items: MediaItem[], index = 0) => {
    if (!items.length) return;
    setLightboxItems(items);
    setOpenIndex(index);
  };

  return (
    <>
      {packageMedia.length > 0 && (
        <div className="package-detail-panel mt-4 border border-black/[.08] bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-black/62">See this package</p>
            <button type="button" onClick={() => open(packageMedia, 0)} className="text-[11px] font-bold text-[#6EAEC6]">View all</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {packageMedia.slice(0, 4).map((item, index) => (
              <button key={item.id} type="button" onClick={() => open(packageMedia, index)} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-black text-left" aria-label={`Open ${item.title}`}>
                <MediaVisual item={item} thumbnail className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[9px] font-medium text-white">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <details className="package-detail-panel mt-4 border border-black/[.08] bg-black/[.018] px-4 py-3">
        <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-black/65"><span>What’s included</span><span className="text-[#7B5C4B]">+</span></summary>
        <ul className="mt-3 space-y-2 pb-1 text-sm leading-5 text-black/48">
          {features.map((feature, index) => (
            <li key={`${index}-${feature}`} className="flex min-h-8 items-center gap-2">
              <span className="text-[#6EAEC6]">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </details>

      <MediaLightbox items={lightboxItems} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
