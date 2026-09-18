"use client";

import { useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function PackageConditionGuide({
  copy,
  media,
  packageName,
}: {
  copy: string;
  media: MediaItem[];
  packageName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const quoteHref = `/quote?package=${encodeURIComponent(packageName)}`;

  return (
    <>
      <details className="mt-4 rounded-2xl border border-black/8 bg-[#fffdfb] px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[#111] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            <span>When should I get this detail?</span>
            <span className="text-[#6EAEC6]">+</span>
          </span>
        </summary>
        <div className="mt-3 border-t border-black/8 pt-3">
          <p className="text-sm leading-6 text-black/52">{copy}</p>
          {media.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-black/35">Example before condition</p>
              <button type="button" onClick={() => setOpenIndex(0)} className="group relative block h-28 w-full overflow-hidden rounded-xl bg-black text-left">
                <MediaVisual item={media[0]} thumbnail className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8 text-xs font-semibold text-white">Tap to see what this level can look like</span>
              </button>
              {media.length > 1 && <button type="button" onClick={() => setOpenIndex(0)} className="mt-2 text-xs font-semibold text-[#6EAEC6]">View {media.length} examples →</button>}
            </div>
          )}
          <div className="mt-4 rounded-xl bg-black/[.035] p-3">
            <p className="text-xs leading-5 text-black/48">Still not sure which package fits your car?</p>
            <a href={quoteHref} className="mt-1 inline-flex text-xs font-bold text-[#6EAEC6]">Get a free photo quote →</a>
          </div>
        </div>
      </details>

      <MediaLightbox items={media} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
