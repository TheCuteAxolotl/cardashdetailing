"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "@/lib/media";
import { getMediaEmbedUrl, getMediaKind, getMediaThumbnailUrl } from "@/lib/media";

type MediaVisualProps = {
  item: MediaItem;
  thumbnail?: boolean;
  className?: string;
  onReady?: () => void;
};

function PlayBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F7F5F2]/25 bg-[#171411]/68 text-lg text-[#F7F5F2] backdrop-blur">▶</span>
    </span>
  );
}

export function MediaVisual({ item, thumbnail = false, className = "", onReady }: MediaVisualProps) {
  const kind = getMediaKind(item.url);
  const thumb = getMediaThumbnailUrl(item.url);

  if (kind === "image") {
    return <img src={item.url} alt={item.title} className={`bg-[linear-gradient(135deg,#3F3027,#171411)] ${className}`} loading={thumbnail ? "lazy" : "eager"} decoding="async" onLoad={onReady} onError={onReady} />;
  }

  if (kind === "youtube") {
    if (thumbnail && thumb) {
      return <><img src={thumb} alt={item.title} className={`bg-[linear-gradient(135deg,#3F3027,#171411)] ${className}`} loading="lazy" decoding="async" onLoad={onReady} onError={onReady} /><PlayBadge /></>;
    }
    const embed = getMediaEmbedUrl(item.url);
    return <iframe src={embed || undefined} title={item.title} className={className} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onLoad={onReady} />;
  }

  if (kind === "vimeo" || kind === "instagram") {
    if (thumbnail) {
      return (
        <div className={`relative flex items-center justify-center bg-[#3F3027] ${className}`}>
          <span className="text-xs font-semibold uppercase tracking-[.18em] text-[#F7F5F2]/45">{kind === "instagram" ? "Instagram" : "Video"}</span>
          <PlayBadge />
        </div>
      );
    }
    const embed = getMediaEmbedUrl(item.url);
    return <iframe src={embed || undefined} title={item.title} className={className} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onLoad={onReady} />;
  }

  return (
    <div className={`relative overflow-hidden bg-[#171411] ${className}`}>
      <video src={item.url} className="h-full w-full object-cover" controls={!thumbnail} muted={thumbnail} playsInline preload={thumbnail ? "metadata" : "auto"} onLoadedData={onReady} onError={onReady} />
      {thumbnail && <PlayBadge />}
    </div>
  );
}

export default function MediaLightbox({ items, openIndex, onClose }: { items: MediaItem[]; openIndex: number | null; onClose: () => void }) {
  const [index, setIndex] = useState(openIndex ?? 0);
  const [mounted, setMounted] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (openIndex == null) return;
    setIndex(openIndex);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("media-lightbox-open");

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && items.length > 1) setIndex((current) => (current - 1 + items.length) % items.length);
      if (event.key === "ArrowRight" && items.length > 1) setIndex((current) => (current + 1) % items.length);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove("media-lightbox-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, items.length, onClose]);

  const item = useMemo(() => items[index] || null, [items, index]);

  useEffect(() => { setMediaReady(false); }, [item?.id, item?.url]);

  if (!mounted || openIndex == null || !item) return null;

  const previous = () => setIndex((current) => (current - 1 + items.length) % items.length);
  const next = () => setIndex((current) => (current + 1) % items.length);

  const lightbox = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#171411]/95 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-[#C0AB9A]/28 bg-[#3F3027] shadow-[0_28px_90px_rgba(23,20,17,.55)] sm:max-h-[92dvh]">
        <div className="z-20 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[#F7F5F2]/10 bg-[#3F3027]/96 px-4 py-3 text-[#F7F5F2] backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-[#F7F5F2]/42">{index + 1} of {items.length}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#F7F5F2]/15 bg-[#F7F5F2]/6 px-3.5 text-sm font-semibold text-[#F7F5F2] shadow-sm" aria-label="Close media">
            <span className="hidden sm:inline">Close</span><span className="text-xl leading-none" aria-hidden="true">×</span>
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#171411]">
          {!mediaReady && (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-[linear-gradient(135deg,#7B5C4B,#3F3027_55%,#171411)]" aria-live="polite">
              <div className="flex flex-col items-center gap-3 text-[#F7F5F2]/45">
                <span className="h-8 w-8 animate-pulse rounded-full border border-[#F7F5F2]/15 bg-[#C0AB9A]/18" />
                <span className="text-xs font-medium">Loading photo…</span>
              </div>
            </div>
          )}

          <MediaVisual item={item} onReady={() => setMediaReady(true)} className={`relative z-10 max-h-[calc(100dvh-132px)] min-h-[260px] w-full object-contain transition-opacity duration-200 sm:max-h-[76vh] sm:min-h-[520px] ${mediaReady ? "opacity-100" : "opacity-0"}`} />

          {items.length > 1 && (
            <>
              <button type="button" onClick={previous} className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#F7F5F2]/18 bg-[#3F3027]/82 text-3xl text-[#F7F5F2] shadow-lg backdrop-blur-xl sm:left-5" aria-label="Previous media">‹</button>
              <button type="button" onClick={next} className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#F7F5F2]/18 bg-[#3F3027]/82 text-3xl text-[#F7F5F2] shadow-lg backdrop-blur-xl sm:right-5 sm:flex" aria-label="Next media">›</button>
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#F7F5F2]/10 bg-[#3F3027] px-4 py-3 sm:hidden">
            <button type="button" onClick={previous} className="rounded-full border border-[#F7F5F2]/15 px-4 py-2 text-sm font-semibold text-[#F7F5F2]/75">← Previous</button>
            <button type="button" onClick={next} className="rounded-full border border-[#F7F5F2]/15 px-4 py-2 text-sm font-semibold text-[#F7F5F2]">Next →</button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}
