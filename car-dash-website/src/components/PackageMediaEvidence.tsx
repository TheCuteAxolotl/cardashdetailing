"use client";

import { useMemo, useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

type FeatureMedia = { feature: string; items: MediaItem[] };

export default function PackageMediaEvidence({ packageMedia, featureMedia }: { packageMedia: MediaItem[]; featureMedia: FeatureMedia[] }) {
  const [lightboxItems, setLightboxItems] = useState<MediaItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasFeatureMedia = useMemo(() => featureMedia.some((entry) => entry.items.length > 0), [featureMedia]);

  const open = (items: MediaItem[], index = 0) => {
    if (!items.length) return;
    setLightboxItems(items);
    setOpenIndex(index);
  };

  return (
    <>
      {packageMedia.length > 0 && (
        <div className="mt-4 rounded-2xl border border-black/8 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-black/62">See this package</p>
            <button type="button" onClick={() => open(packageMedia, 0)} className="text-[11px] font-bold text-[#FF2D2D]">View all →</button>
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

      <details className="mt-4 rounded-2xl border border-black/8 bg-black/[.02] px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-black/65">What’s included</summary>
        <ul className="mt-3 space-y-2 pb-1 text-sm leading-5 text-black/48">
          {featureMedia.map((entry) => {
            const media = entry.items;
            return (
              <li key={entry.feature} className="flex min-h-8 items-center gap-2">
                <span className="text-[#FF2D2D]">✓</span>
                {media.length ? (
                  <button type="button" onClick={() => open(media, 0)} className="group flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                    <span className="min-w-0 flex-1 text-black/52 underline decoration-black/15 underline-offset-4 group-hover:text-black/75">{entry.feature}</span>
                    <span className="relative h-8 w-11 shrink-0 overflow-hidden rounded-lg bg-black">
                      <MediaVisual item={media[0]} thumbnail className="h-full w-full object-cover" />
                    </span>
                  </button>
                ) : <span>{entry.feature}</span>}
              </li>
            );
          })}
        </ul>
        {hasFeatureMedia && <p className="mt-2 border-t border-black/8 pt-2 text-[10px] leading-4 text-black/35">Tap an underlined item to see a photo or video of that part of the detail.</p>}
      </details>

      <MediaLightbox items={lightboxItems} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
