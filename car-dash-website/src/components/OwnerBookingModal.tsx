"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Locked, keyboard-accessible modal for adding or converting owner bookings. */
export default function OwnerBookingModal({
  open, onClose, children, title = "New booking",
}: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const layer = document.createElement("div");
    layer.id = "car-dash-owner-booking-layer";
    document.body.appendChild(layer);
    setPortal(layer);
    return () => { layer.remove(); setPortal(null); };
  }, [open]);

  useEffect(() => {
    if (!open || !portal) return;
    const y = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const old = {
      position: body.style.position, top: body.style.top, width: body.style.width,
      overflow: body.style.overflow, htmlOverflow: html.style.overflow,
    };
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const otherElements = Array.from(body.children).filter(item => item !== portal && item instanceof HTMLElement) as HTMLElement[];
    const initial = otherElements.map(el => ({ el, inert: el.inert, aria: el.getAttribute("aria-hidden") }));
    for (const item of initial) { item.el.inert = true; item.el.setAttribute("aria-hidden", "true"); }
    body.style.position = "fixed";
    body.style.top = "-" + y + "px";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    requestAnimationFrame(() => dialog.current?.focus({ preventScroll: true }));

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const elements = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
      )).filter(el => el.getClientRects().length && !el.closest("[inert]"));
      if (!elements.length) { event.preventDefault(); dialog.current.focus(); return; }
      if (event.shiftKey && (document.activeElement === elements[0] || document.activeElement === dialog.current)) {
        event.preventDefault(); elements[elements.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) {
        event.preventDefault(); elements[0].focus();
      }
    };
    const guard = (event: FocusEvent) => {
      if (dialog.current && event.target instanceof Node && !dialog.current.contains(event.target)) dialog.current.focus();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", guard);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", guard);
      for (const item of initial) {
        item.el.inert = item.inert;
        if (item.aria === null) item.el.removeAttribute("aria-hidden");
        else item.el.setAttribute("aria-hidden", item.aria);
      }
      body.style.position = old.position;
      body.style.top = old.top;
      body.style.width = old.width;
      body.style.overflow = old.overflow;
      html.style.overflow = old.htmlOverflow;
      window.scrollTo(0, y);
      requestAnimationFrame(() => previousFocus?.focus({ preventScroll: true }));
    };
  }, [open, portal]);

  if (!open || !portal) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-0 backdrop-blur-lg sm:p-5"
      style={{ height: "100dvh", overscrollBehavior: "contain" }}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="owner-booking-dialog-title" tabIndex={-1}
        className="relative flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-white/20 bg-[#171717] text-[#f4efe5] shadow-[0_30px_120px_#000c] outline-none sm:h-auto sm:max-h-[min(92dvh,1050px)] sm:rounded-3xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#202020] px-5 py-4 sm:px-7" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-[#d6b779]">Car Dash · Owner</p><h2 id="owner-booking-dialog-title" className="mt-1 text-xl font-semibold">{title}</h2></div>
          <button type="button" onClick={() => closeRef.current()} aria-label="Close booking form"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-[#292929] text-[#f4efe5] hover:border-[#d6b779]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6"
          style={{ WebkitOverflowScrolling: "touch", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
          {children}
        </div>
      </section>
    </div>,
    portal
  );
}
