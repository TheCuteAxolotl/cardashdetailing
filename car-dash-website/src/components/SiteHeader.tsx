"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY, OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

const mainLinks = [
  ["/#prices", "Prices"],
  ["/gallery", "Gallery"],
  ["/reviews", "Reviews"],
  ["/faq", "FAQ"],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [staffAccess, setStaffAccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setStaffAccess(Boolean(data?.staffAccess));
      })
      .catch(() => {
        setUser(null);
        setStaffAccess(false);
      });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("mobile-nav-open");
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove("mobile-nav-open");
    };
  }, [menuOpen]);

  const owner = Boolean(user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));
  const staff = Boolean(user && !owner && staffAccess);
  const openSupport = () => {
    window.dispatchEvent(new Event("open-support"));
    setMenuOpen(false);
  };

  return (
    <>
      <div className="border-b border-black/10 bg-[#FF2D2D] text-[#0D0D0D]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 text-[10px] font-bold uppercase tracking-[.18em] sm:px-8">
          <span>South Elgin · Mobile detailing</span>
          <a href={`tel:${BUSINESS_PHONE}`} className="hover:opacity-70">{BUSINESS_PHONE_DISPLAY}</a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0D0D0D]/96 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <a href="/" aria-label="Car Dash Detailing home" className="flex shrink-0 items-center gap-3">
            <Image src="/car-dash-logo.png" alt="Car Dash Detailing" width={96} height={96} priority className="h-11 w-11 object-contain" />
            <span className="hidden text-sm font-semibold tracking-[-.02em] text-white/90 sm:block">Car Dash Detailing</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/58 lg:flex">
            {mainLinks.map(([href, label]) => (
              <a key={href} href={href} className="hover:text-white">{label}</a>
            ))}
            <button type="button" onClick={openSupport} className="hover:text-white">Help</button>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {!user ? (
              <a href="/login" className="px-3 py-2 text-xs font-semibold text-white/48 hover:text-white">Login</a>
            ) : (
              <a href="/account" className="px-3 py-2 text-xs font-semibold text-white/55 hover:text-white">Account</a>
            )}
            {staff && <a href="/admin/dashboard" className="px-3 py-2 text-xs font-semibold text-[#FF2D2D]">Staff</a>}
            {owner && <a href="/owner/dashboard" className="px-3 py-2 text-xs font-semibold text-[#FF2D2D]">Owner</a>}
            <a href="/#book" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-xs font-bold text-[#0D0D0D]">Book now</a>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full border border-white/12 bg-white/[.03] px-4 py-2.5 text-xs font-semibold lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div id="mobile-site-menu" aria-hidden={!menuOpen} className={`mobile-menu-shell border-t bg-[#0D0D0D] lg:hidden ${menuOpen ? "mobile-menu-shell-open" : ""}`}>
          <div className="mobile-menu-scroll max-h-[70dvh] overflow-y-auto px-5 py-5 pb-24">
            <nav className="grid gap-1 text-base">
              <a href="/" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3.5 font-semibold text-white">Home</a>
              {mainLinks.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3.5 text-white/68 hover:bg-white/[.04] hover:text-white">{label}</a>
              ))}
              <button type="button" onClick={openSupport} className="rounded-2xl px-4 py-3.5 text-left text-white/68 hover:bg-white/[.04] hover:text-white">Help</button>
              <div className="my-3 h-px bg-white/8" />
              {!user ? (
                <a href="/login" className="rounded-2xl px-4 py-3.5 text-white/68">Login</a>
              ) : (
                <a href="/account" className="rounded-2xl px-4 py-3.5 text-white/68">Account</a>
              )}
              {user && !owner && !staff && <a href="/dashboard" className="rounded-2xl px-4 py-3.5 text-white/68">My dashboard</a>}
              {staff && <a href="/admin/dashboard" className="rounded-2xl px-4 py-3.5 text-[#FF2D2D]">Staff dashboard</a>}
              {owner && <a href="/owner/dashboard" className="rounded-2xl px-4 py-3.5 text-[#FF2D2D]">Owner dashboard</a>}
              <a href="/#book" onClick={() => setMenuOpen(false)} className="mt-3 rounded-2xl bg-[#FF2D2D] px-5 py-4 text-center text-sm font-bold text-[#0D0D0D]">Book now</a>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
