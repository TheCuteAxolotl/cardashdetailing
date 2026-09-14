"use client";

import { useState } from "react";
import MediaLightbox, { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

export default function ServiceMediaEvidence({ items }: { items: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!items.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-black/[.025] py-1.5 pl-1.5 pr-3 text-xs font-semibold text-black/55 hover:bg-black/[.05]"
      >
        <span className="relative h-8 w-11 shrink-0 overflow-hidden rounded-full bg-black">
          <MediaVisual item={items[0]} thumbnail className="h-full w-full object-cover" />
        </span>
        <span>See work{items.length > 1 ? ` (${items.length})` : ""}</span>
      </button>
      <MediaLightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
