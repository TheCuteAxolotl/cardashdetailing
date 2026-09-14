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
] as const;

const moreLinks = [
  ["/about", "About Car Dash", "Who we are and how mobile detailing works."],
  ["/services", "All services", "Browse every detailing and specialty service."],
  ["/products-we-use", "Products we use", "See the products and brands used on your vehicle."],
  ["/faq", "FAQ", "Quick answers before you book."],
  ["/contact", "Contact", "Call, text, or send us a message."],
  ["/quote", "Exact quote", "Get a personalized price for your vehicle."],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [staffAccess, setStaffAccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
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
    setMobileMoreOpen(false);
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
              <a key={href} href={href} className="transition-colors hover:text-white">{label}</a>
            ))}

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                More
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180">
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>

              <div className="absolute left-1/2 top-[calc(100%+18px)] z-[70] w-[330px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-white/10 bg-[#151515] p-2 shadow-2xl shadow-black/50">
                <div className="grid gap-1">
                  {moreLinks.map(([href, label, description]) => (
                    <a key={href} href={href} className="rounded-[18px] px-4 py-3 transition-colors hover:bg-white/[.06]">
                      <span className="block text-sm font-semibold text-white">{label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-white/42">{description}</span>
                    </a>
                  ))}
                  <button type="button" onClick={openSupport} className="rounded-[18px] px-4 py-3 text-left transition-colors hover:bg-white/[.06]">
                    <span className="block text-sm font-semibold text-white">Need help?</span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/42">Open support without leaving the page.</span>
                  </button>
                </div>
              </div>
            </details>
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

              <button
                type="button"
                aria-expanded={mobileMoreOpen}
                aria-controls="mobile-more-menu"
                onClick={() => setMobileMoreOpen((value) => !value)}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-white/68 hover:bg-white/[.04] hover:text-white"
              >
                <span>More</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 transition-transform duration-300 ${mobileMoreOpen ? "rotate-180" : ""}`}>
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div id="mobile-more-menu" className={`mobile-accordion ${mobileMoreOpen ? "mobile-accordion-open" : ""}`}>
                <div className="mobile-accordion-inner">
                  <div className="ml-3 grid gap-1 border-l border-white/8 pl-3 pb-2">
                    {moreLinks.map(([href, label]) => (
                      <a key={href} href={href} onClick={() => { setMenuOpen(false); setMobileMoreOpen(false); }} className="rounded-2xl px-4 py-3 text-sm text-white/58 hover:bg-white/[.04] hover:text-white">{label}</a>
                    ))}
                    <button type="button" onClick={openSupport} className="rounded-2xl px-4 py-3 text-left text-sm text-white/58 hover:bg-white/[.04] hover:text-white">Need help?</button>
                  </div>
                </div>
              </div>

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
