"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY, OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

const mainLinks = [
  ["/#prices", "Pricing"],
  ["/gallery", "Work"],
  ["/reviews", "Reviews"],
] as const;

const HOME_LOGO = "/favicon.png";

const detailingLinks = [
  ["/car-detailing-packages", "Detail packages", "Interior + exterior packages."],
  ["/interior-detailing", "Interior detailing", "Interior-only cleaning and restoration."],
  ["/exterior-detailing", "Exterior detailing", "Wash, decontamination and protection."],
  ["/paint-correction", "Paint correction", "Swirl, haze and defect reduction."],
] as const;

const specialtyLinks = [
  ["/ceramic-coatings", "Ceramic coating", "Long-term paint protection."],
  ["/marine-detailing", "Marine detailing", "Boat cleaning, correction and protection."],
] as const;

const moreLinks = [
  ["/about", "About", "How Car Dash works."],
  ["/products-we-use", "Products", "Products and systems used on your vehicle."],
  ["/faq", "FAQ", "Answers before you book."],
  ["/contact", "Contact", "Call, text or send a message."],
  ["/quote", "Exact quote", "Get a price for your specific vehicle."],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [staffAccess, setStaffAccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<"service" | "more" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setDesktopMenu(null);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const owner = Boolean(user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));
  const staff = Boolean(user && !owner && staffAccess);

  const openMenu = (menu: "service" | "more") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDesktopMenu(menu);
  };

  const closeMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDesktopMenu(null), 120);
  };

  const openSupport = () => {
    window.dispatchEvent(new Event("open-support"));
    setMenuOpen(false);
  };

  return (
    <>
      <div className="border-b border-white/10 bg-[#111] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-2 text-[10px] font-medium uppercase tracking-[.14em] text-white/55 sm:px-8">
          <span>South Elgin, Illinois · Mobile detailing</span>
          <a href={`tel:${BUSINESS_PHONE}`} className="text-white/70 hover:text-white">{BUSINESS_PHONE_DISPLAY}</a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-black/[.08] bg-[#faf9f7]/95 text-[#111] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
          <a href="/" aria-label="Car Dash Detailing home" className="flex shrink-0 items-center gap-3">
            <img src={HOME_LOGO} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
            <div className="leading-none">
              <span className="block text-[15px] font-bold tracking-[.06em]">CAR / DASH</span>
              <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[.2em] text-black/40">Mobile detailing</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-black/62 lg:flex">
            {mainLinks.map(([href, label]) => (
              <a key={href} href={href} className="border-b border-transparent py-2 hover:border-black hover:text-black">{label}</a>
            ))}

            <div className="relative" onMouseEnter={() => openMenu("service")} onMouseLeave={closeMenu}>
              <button type="button" onClick={() => setDesktopMenu(desktopMenu === "service" ? null : "service")} className="flex items-center gap-1.5 border-b border-transparent py-2 hover:border-black hover:text-black">
                Services
                <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform ${desktopMenu === "service" ? "rotate-180" : ""}`}><path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`absolute left-1/2 top-full w-[390px] -translate-x-1/2 pt-5 transition ${desktopMenu === "service" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}>
                <div className="border border-black/10 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,.12)]">
                  <p className="px-3 pb-2 pt-2 text-[9px] font-semibold uppercase tracking-[.16em] text-black/35">Detailing</p>
                  {[...detailingLinks, ...specialtyLinks].map(([href, label, description]) => (
                    <a key={href} href={href} className="block rounded-md px-3 py-3 hover:bg-black/[.035]">
                      <span className="block text-sm font-semibold text-[#111]">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-black/42">{description}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative" onMouseEnter={() => openMenu("more")} onMouseLeave={closeMenu}>
              <button type="button" onClick={() => setDesktopMenu(desktopMenu === "more" ? null : "more")} className="flex items-center gap-1.5 border-b border-transparent py-2 hover:border-black hover:text-black">
                More
                <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform ${desktopMenu === "more" ? "rotate-180" : ""}`}><path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`absolute left-1/2 top-full w-[330px] -translate-x-1/2 pt-5 transition ${desktopMenu === "more" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}>
                <div className="border border-black/10 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,.12)]">
                  {moreLinks.map(([href, label, description]) => (
                    <a key={href} href={href} className="block rounded-md px-3 py-3 hover:bg-black/[.035]">
                      <span className="block text-sm font-semibold text-[#111]">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-black/42">{description}</span>
                    </a>
                  ))}
                  <button onClick={openSupport} className="block w-full rounded-md px-3 py-3 text-left hover:bg-black/[.035]">
                    <span className="block text-sm font-semibold text-[#111]">Support</span>
                    <span className="mt-1 block text-xs leading-5 text-black/42">Open the website support chat.</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            {!user ? <a href="/login" className="text-xs font-medium text-black/48 hover:text-black">Login</a> : <a href="/account" className="text-xs font-medium text-black/48 hover:text-black">Account</a>}
            {staff && <a href="/admin/dashboard" className="text-xs font-medium text-black/55 hover:text-black">Staff</a>}
            {owner && <a href="/owner/dashboard" className="text-xs font-medium text-black/55 hover:text-black">Owner</a>}
            <a href="/#book" className="rounded-md bg-[#111] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black">Book an appointment</a>
          </div>

          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-md border border-black/10 bg-white lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"}>
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">{menuOpen ? <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-black/[.08] bg-[#faf9f7] lg:hidden">
            <div className="mx-auto max-h-[calc(100vh-105px)] max-w-[1440px] overflow-y-auto px-5 py-5 sm:px-8">
              <nav className="divide-y divide-black/[.07] border-y border-black/[.07]">
                <a href="/#prices" className="block py-4 text-sm font-medium" onClick={() => setMenuOpen(false)}>Pricing</a>
                <a href="/gallery" className="block py-4 text-sm font-medium" onClick={() => setMenuOpen(false)}>Work</a>
                <a href="/reviews" className="block py-4 text-sm font-medium" onClick={() => setMenuOpen(false)}>Reviews</a>
                <button onClick={() => setMobileServiceOpen(!mobileServiceOpen)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"><span>Services</span><span>{mobileServiceOpen ? "−" : "+"}</span></button>
                {mobileServiceOpen && <div className="pb-4 pl-4">{[...detailingLinks, ...specialtyLinks].map(([href,label]) => <a key={href} href={href} className="block py-2.5 text-sm text-black/55" onClick={() => setMenuOpen(false)}>{label}</a>)}</div>}
                <button onClick={() => setMobileMoreOpen(!mobileMoreOpen)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"><span>More</span><span>{mobileMoreOpen ? "−" : "+"}</span></button>
                {mobileMoreOpen && <div className="pb-4 pl-4">{moreLinks.map(([href,label]) => <a key={href} href={href} className="block py-2.5 text-sm text-black/55" onClick={() => setMenuOpen(false)}>{label}</a>)}<button onClick={openSupport} className="block py-2.5 text-sm text-black/55">Support</button></div>}
              </nav>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <a href={user ? "/account" : "/login"} className="rounded-md border border-black/10 bg-white px-4 py-3 text-center text-sm font-medium">{user ? "Account" : "Login"}</a>
                <a href="/#book" className="rounded-md bg-[#111] px-4 py-3 text-center text-sm font-semibold text-white" onClick={() => setMenuOpen(false)}>Book now</a>
              </div>
              {owner && <a href="/owner/dashboard" className="mt-2 block rounded-md border border-black/10 bg-white px-4 py-3 text-center text-sm font-medium">Owner console</a>}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
