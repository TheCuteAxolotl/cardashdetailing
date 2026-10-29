"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";

type Props = {
  photos: readonly string[];
  className?: string;
  thumbnailClassName?: string;
  altPrefix?: string;
};
type Gesture = { startX: number; startY: number; prevX: number; prevY: number; distance: number; initialZoom: number; pinch: boolean };
function distance(event: TouchEvent<HTMLDivElement>) {
  return event.touches.length >= 2 ? Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY) : 0;
}

/** Shared message photo viewer. Works for stored chat photos and private MMS media. */
export default function MessagePhotoGallery({
  photos, className = "mt-3 flex flex-wrap gap-2",
  thumbnailClassName = "h-32 w-32 max-w-full rounded-xl object-cover sm:h-44 sm:w-44",
  altPrefix = "Message photo",
}: Props) {
  const images = photos.filter(src => typeof src === "string" && src.length > 0);
  const [mounted, setMounted] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const move = useCallback((delta: number) => {
    setOpenIndex(index => index === null || images.length < 2 ? index : (index + delta + images.length) % images.length);
  }, [images.length]);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, [openIndex]);
  useEffect(() => {
    if (openIndex === null) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); };
  }, [openIndex, close, move]);

  function touchStart(event: TouchEvent<HTMLDivElement>) {
    const t = event.touches[0];
    if (!t) return;
    gesture.current = { startX: t.clientX, startY: t.clientY, prevX: t.clientX, prevY: t.clientY,
      distance: distance(event), initialZoom: zoom, pinch: event.touches.length > 1 };
  }
  function touchMove(event: TouchEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start) return;
    if (event.touches.length >= 2) {
      start.pinch = true;
      if (start.distance > 0) setZoom(Math.max(1, Math.min(4, start.initialZoom * distance(event) / start.distance)));
    } else if (zoom > 1 && event.touches[0]) {
      const t = event.touches[0];
      setOffset(pos => ({ x: pos.x + t.clientX - start.prevX, y: pos.y + t.clientY - start.prevY }));
      start.prevX = t.clientX; start.prevY = t.clientY;
    }
  }
  function touchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || event.touches.length) return;
    gesture.current = null;
    const t = event.changedTouches[0];
    if (!t || start.pinch) return;
    const dx = t.clientX - start.startX, dy = t.clientY - start.startY;
    if (zoom === 1 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      move(dx < 0 ? 1 : -1); lastTap.current = null; return;
    }
    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) return;
    const last = lastTap.current;
    const now = Date.now();
    if (last && now - last.time < 340 && Math.hypot(last.x - t.clientX, last.y - t.clientY) < 45) {
      setZoom(v => v > 1 ? 1 : 2); setOffset({ x: 0, y: 0 }); lastTap.current = null;
    } else lastTap.current = { time: now, x: t.clientX, y: t.clientY };
  }

  if (!images.length) return null;
  return <>
    <div className={className}>
      {images.map((src, i) => (
        <button type="button" key={src + ":" + i} onClick={() => setOpenIndex(i)}
          aria-label={"View " + altPrefix.toLowerCase() + " " + (i + 1) + " of " + images.length + " full screen"}
          className="group relative inline-flex min-w-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5c995]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={altPrefix + " " + (i + 1)} loading="lazy" className={thumbnailClassName + " transition-transform group-hover:scale-[1.03]"} />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/75 px-2 py-1 text-[10px] text-white">Expand ↗</span>
        </button>
      ))}
    </div>
    {mounted && openIndex !== null && createPortal(
      <div role="dialog" aria-modal="true" aria-label="Full-screen message photos"
        className="fixed inset-0 z-[99999] flex flex-col bg-[#080808] text-white" style={{height:"100dvh",overscrollBehavior:"contain"}}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#161616] px-3 py-3 sm:px-5" style={{paddingTop:"max(12px, env(safe-area-inset-top))"}}>
          <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d6b779]">Car Dash · Message photo</p>
            <p className="mt-1 text-sm tabular-nums">{openIndex + 1} of {images.length}</p></div>
          <div className="flex gap-2">
            <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => {setZoom(v=>Math.max(1,v-0.5));setOffset({x:0,y:0});}} className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 text-xl disabled:opacity-35">−</button>
            <button type="button" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => {setZoom(v=>Math.min(4,v+0.5));setOffset({x:0,y:0});}} className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 text-xl disabled:opacity-35">+</button>
            <button ref={closeButton} type="button" aria-label="Close photo viewer" onClick={close} className="ml-2 grid h-11 w-11 place-items-center rounded-xl border border-[#d6b779]/40 bg-[#29251d] text-2xl text-[#e5c995]">×</button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 py-4 sm:px-16"
          style={{touchAction:"none"}} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd}
          onDoubleClick={() => {setZoom(v=>v>1?1:2);setOffset({x:0,y:0});}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[openIndex]} alt={altPrefix + " " + (openIndex + 1) + " enlarged"}
            className="h-full w-full select-none object-contain" draggable={false}
            style={{transform:"translate("+offset.x+"px,"+offset.y+"px) scale("+zoom+")"}} />
          {images.length > 1 && <>
            <button type="button" aria-label="Previous photo" onClick={() => move(-1)} className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-2xl sm:left-5">‹</button>
            <button type="button" aria-label="Next photo" onClick={() => move(1)} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-2xl sm:right-5">›</button>
          </>}
        </div>
        <div className="shrink-0 border-t border-white/10 bg-[#161616] px-4 py-3 text-center text-xs text-[#c2bcb1]"
          style={{paddingBottom:"max(12px, env(safe-area-inset-bottom))"}}>
          {images.length > 1 ? "Swipe to browse · " : ""}Double-tap or pinch to zoom · Esc to close
        </div>
      </div>, document.body
    )}
  </>;
}
