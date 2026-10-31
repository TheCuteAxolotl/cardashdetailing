"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BookingForm from "@/components/BookingForm";
import type { SiteContent } from "@/lib/site-defaults";

type BookingSelection = { search: string; id: number };

export default function PublicBookingModal({ initialSiteContent }: { initialSiteContent: SiteContent }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const formerFocus = useRef<HTMLElement | null>(null);
  const counter = useRef(0);
  const close = useCallback(() => {
    setSelection(null);
    // A shared /#book link also opens the modal directly. Clear its hash on exit.
    if (window.location.hash === "#book") {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    window.requestAnimationFrame(() => formerFocus.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const layer = document.createElement("div");
    layer.id = "car-dash-booking-dialog-layer";
    document.body.appendChild(layer);
    setPortal(layer);
    return () => { layer.remove(); };
  }, []);

  useEffect(() => {
    const open = (search: string) => {
      formerFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSelection({ search, id: ++counter.current });
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      let url: URL;
      try { url = new URL(anchor.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin || url.hash.toLowerCase() !== "#book") return;
      event.preventDefault();
      open(url.search);
    };
    // Handle bookmarks, QR codes and external links directly to /#book.
    const onHash = () => {
      if (window.location.hash.toLowerCase() === "#book") open(window.location.search);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHash);
    if (window.location.hash.toLowerCase() === "#book") open(window.location.search);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (!selection || !portal) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const oldStyle = {
      overflow: body.style.overflow, position: body.style.position, top: body.style.top,
      left: body.style.left, right: body.style.right, width: body.style.width,
      htmlOverflow: html.style.overflow,
    };
    // Inert makes underlying elements non-focusable and non-interactive,
    // not merely visually covered by a backdrop.
    const siblings = Array.from(body.children).filter(element => element !== portal && element instanceof HTMLElement) as HTMLElement[];
    const inertStates = siblings.map(element => ({ element, inert: element.inert, ariaHidden: element.getAttribute("aria-hidden") }));
    for (const { element } of inertStates) { element.inert = true; element.setAttribute("aria-hidden", "true"); }
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = -scrollY + "px";
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overflow = "hidden";
    window.requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));

    const keepFocus = (event: FocusEvent) => {
      if (dialogRef.current && event.target instanceof Node && !dialogRef.current.contains(event.target)) {
        dialogRef.current.focus({ preventScroll: true });
      }
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(element => element.getClientRects().length && !element.closest("[inert]"));
      if (!focusable.length) { event.preventDefault(); dialogRef.current.focus(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("focusin", keepFocus);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("focusin", keepFocus);
      document.removeEventListener("keydown", keyHandler, true);
      for (const { element, inert, ariaHidden } of inertStates) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      body.style.overflow = oldStyle.overflow;
      body.style.position = oldStyle.position;
      body.style.top = oldStyle.top;
      body.style.left = oldStyle.left;
      body.style.right = oldStyle.right;
      body.style.width = oldStyle.width;
      html.style.overflow = oldStyle.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [selection, portal, close]);

  if (!selection || !portal) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-0 backdrop-blur-lg sm:p-5 lg:p-8"
      style={{ height: "100dvh", overscrollBehavior: "contain" }}
      aria-label="Booking overlay"
    >
      {/* Clicking the blurred backdrop intentionally does not close the form. */}
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="car-dash-booking-dialog-title"
        tabIndex={-1}
        className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/15 bg-[#161616] text-[#f4efe5] shadow-[0_28px_100px_rgba(0,0,0,.75)] outline-none sm:h-auto sm:max-h-[min(92dvh,1050px)] sm:rounded-3xl"
      >
        <header className="z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/15 bg-[#20201f] px-5 py-4 sm:px-7"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6b779]">Car Dash Detailing</p>
            <h2 id="car-dash-booking-dialog-title" className="mt-1 text-xl font-semibold tracking-tight text-[#f4efe5] sm:text-2xl">Book an appointment</h2>
            <p className="mt-1 text-xs text-[#b9b5ad]">Mobile detailing · We come to you</p>
          </div>
          <button type="button" onClick={close} aria-label="Close booking form"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-[#2a2926] text-[#f4efe5] transition hover:border-[#d6b779] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8"
          style={{ WebkitOverflowScrolling: "touch", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
          <BookingForm key={selection.id} bookingSearch={selection.search} initialSiteContent={initialSiteContent} onClose={close} />
        </div>
      </section>
    </div>,
    portal
  );
}
