"use client";

import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/media";
import { getMediaEmbedUrl, getMediaKind, getMediaThumbnailUrl } from "@/lib/media";

function PlayBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/65 text-lg text-white backdrop-blur">▶</span>
    </span>
  );
}

export function MediaVisual({ item, thumbnail = false, className = "" }: { item: MediaItem; thumbnail?: boolean; className?: string }) {
  const kind = getMediaKind(item.url);
  const thumb = getMediaThumbnailUrl(item.url);

  if (kind === "image") {
    return <img src={item.url} alt={item.title} className={className} loading={thumbnail ? "lazy" : "eager"} />;
  }

  if (kind === "youtube") {
    if (thumbnail && thumb) {
      return <><img src={thumb} alt={item.title} className={className} loading="lazy" /><PlayBadge /></>;
    }
    const embed = getMediaEmbedUrl(item.url);
    return <iframe src={embed || undefined} title={item.title} className={className} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }

  if (kind === "vimeo") {
    if (thumbnail) {
      return <div className={`relative flex items-center justify-center bg-[#151515] ${className}`}><span className="text-xs font-semibold uppercase tracking-[.18em] text-white/45">Video</span><PlayBadge /></div>;
    }
    const embed = getMediaEmbedUrl(item.url);
    return <iframe src={embed || undefined} title={item.title} className={className} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        src={item.url}
        className="h-full w-full object-cover"
        controls={!thumbnail}
        muted={thumbnail}
        playsInline
        preload="metadata"
      />
      {thumbnail && <PlayBadge />}
    </div>
  );
}

export default function MediaLightbox({ items, openIndex, onClose }: { items: MediaItem[]; openIndex: number | null; onClose: () => void }) {
  const [index, setIndex] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex == null) return;
    setIndex(openIndex);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, items.length, onClose]);

  const item = useMemo(() => items[index] || null, [items, index]);
  if (openIndex == null || !item) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl text-white" aria-label="Close media">×</button>
      {items.length > 1 && <button type="button" onClick={() => setIndex((index - 1 + items.length) % items.length)} className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-3xl text-white sm:left-6" aria-label="Previous media">‹</button>}
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/12 bg-[#0D0D0D]">
        <div className="relative flex min-h-[280px] flex-1 items-center justify-center bg-black sm:min-h-[520px]">
          <MediaVisual item={item} className="max-h-[76vh] min-h-[280px] w-full object-contain sm:min-h-[520px]" />
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-white">
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-white/40">{index + 1} of {items.length}</p></div>
          {items.length > 1 && <button type="button" onClick={() => setIndex((index + 1) % items.length)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">Next →</button>}
        </div>
      </div>
      {items.length > 1 && <button type="button" onClick={() => setIndex((index + 1) % items.length)} className="absolute right-3 hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-3xl text-white sm:right-6 sm:flex" aria-label="Next media">›</button>}
    </div>
  );
}
