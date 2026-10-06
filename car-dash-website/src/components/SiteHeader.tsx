"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY, OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

const mainLinks = [
  ["/#prices", "Prices"],
  ["/gallery", "Gallery"],
  ["/reviews", "Reviews"],
] as const;

const HOME_LOGO = "data:image/png;base64,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";

const detailingLinks = [
  ["/car-detailing-packages", "Packages", "Essential, Full, and Signature Detail."],
  ["/interior-detailing", "Interior", "Interior-only detailing options."],
  ["/exterior-detailing", "Exterior", "Exterior cleaning, decontamination, and protection."],
  ["/paint-correction", "Paint Correction", "Swirl, haze, oxidation, and defect reduction."],
] as const;

const specialtyLinks = [
  ["/marine-detailing", "Marine", "Boat cleaning, correction, and protection."],
  ["/ceramic-coatings", "Ceramic Coating", "Long-term paint protection systems."],
] as const;

const moreLinks = [
  ["/about", "About Car Dash", "Who we are and how mobile detailing works."],
  ["/products-we-use", "Products we use", "See the products and brands used on your vehicle."],
  ["/faq", "FAQ", "Quick answers before you book."],
  ["/contact", "Contact", "Call, text, or send us a message."],
  ["/quote", "Exact quote", "Get a personalized price for your vehicle."],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [staffAccess, setStaffAccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<"service" | "more" | null>(null);
  const desktopCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  }, [pathname]);

  const openDesktopMenu = (menu: "service" | "more") => {
    if (desktopCloseTimer.current) clearTimeout(desktopCloseTimer.current);
    desktopCloseTimer.current = null;
    setDesktopMenu(menu);
  };

  const scheduleDesktopClose = () => {
    if (desktopCloseTimer.current) clearTimeout(desktopCloseTimer.current);
    desktopCloseTimer.current = setTimeout(() => setDesktopMenu(null), 140);
  };

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
    setMobileServiceOpen(false);
    setMobileMoreOpen(false);
  };

  return (
    <>
      <div className="bg-[linear-gradient(90deg,#EFE8E2,#F7F5F2_48%,#C0AB9A)] text-[#171411]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#3F3027]/65 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7B5C4B]" />
            South Elgin · Mobile detailing
          </span>
          <a href={`tel:${BUSINESS_PHONE}`} className="hover:text-[#171411]">{BUSINESS_PHONE_DISPLAY}</a>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-[linear-gradient(90deg,rgba(239,232,226,.92),rgba(247,245,242,.90)_48%,rgba(192,171,154,.78))] py-2.5 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 rounded-[22px] border border-[#C0AB9A]/45 bg-[#F7F5F2]/90 px-4 shadow-[0_14px_44px_rgba(23,20,17,.12)] backdrop-blur-2xl sm:px-6">
          <a href="/" aria-label="Car Dash Detailing home" className="flex shrink-0 items-center gap-3">
            <img
              src={HOME_LOGO}
              alt="Car Dash Detailing"
              width={64}
              height={64}
              className="h-10 w-[72px] shrink-0 object-cover object-center"
            />
            <span className="hidden text-sm font-semibold tracking-[-.025em] text-[#171411] sm:block">Car Dash Detailing</span>
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-[#3F3027]/10 bg-[#EFE8E2]/70 p-1 text-sm font-medium text-[#3F3027]/72 lg:flex">
            {mainLinks.map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 transition-colors hover:bg-[#F7F5F2] hover:text-[#171411] hover:shadow-sm">
                {label}
              </a>
            ))}

            <div
              className="relative"
              onMouseEnter={() => openDesktopMenu("service")}
              onMouseLeave={scheduleDesktopClose}
              onFocusCapture={() => openDesktopMenu("service")}
            >
              <button
                type="button"
                aria-expanded={desktopMenu === "service"}
                onClick={() => setDesktopMenu((current) => current === "service" ? null : "service")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-200 ${desktopMenu === "service" ? "bg-[#F7F5F2] text-[#171411] shadow-sm" : "hover:bg-[#F7F5F2] hover:text-[#171411] hover:shadow-sm"}`}
              >
                Service
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform duration-200 ${desktopMenu === "service" ? "rotate-180" : ""}`}>
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={`absolute left-1/2 top-full z-[70] w-[360px] -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${desktopMenu === "service" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}>
                <div className={`overflow-hidden rounded-[24px] border border-[#C0AB9A]/55 bg-[#F7F5F2]/96 p-2 text-[#171411] shadow-[0_28px_80px_rgba(23,20,17,.18)] backdrop-blur-2xl transition-transform duration-200 ease-out ${desktopMenu === "service" ? "scale-100" : "scale-[.985]"}`}>
                  <div className="px-4 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7B5C4B]">Detailing</div>
                  <div className="grid gap-1">
                    {detailingLinks.map(([href, label, description]) => (
                      <a key={href} href={href} className="rounded-[18px] px-4 py-3 transition-all duration-150 hover:translate-x-0.5 hover:bg-[#EFE8E2]">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">{description}</span>
                      </a>
                    ))}
                  </div>
                  <div className="mx-3 my-2 h-px bg-[#C0AB9A]/40" />
                  <div className="grid gap-1">
                    {specialtyLinks.map(([href, label, description]) => (
                      <a key={href} href={href} className="rounded-[18px] px-4 py-3 transition-all duration-150 hover:translate-x-0.5 hover:bg-[#EFE8E2]">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">{description}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => openDesktopMenu("more")}
              onMouseLeave={scheduleDesktopClose}
              onFocusCapture={() => openDesktopMenu("more")}
            >
              <button
                type="button"
                aria-expanded={desktopMenu === "more"}
                onClick={() => setDesktopMenu((current) => current === "more" ? null : "more")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-200 ${desktopMenu === "more" ? "bg-[#F7F5F2] text-[#171411] shadow-sm" : "hover:bg-[#F7F5F2] hover:text-[#171411] hover:shadow-sm"}`}
              >
                More
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform duration-200 ${desktopMenu === "more" ? "rotate-180" : ""}`}>
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={`absolute left-1/2 top-full z-[70] w-[330px] -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${desktopMenu === "more" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}>
                <div className={`overflow-hidden rounded-[24px] border border-[#C0AB9A]/55 bg-[#F7F5F2]/96 p-2 text-[#171411] shadow-[0_28px_80px_rgba(23,20,17,.18)] backdrop-blur-2xl transition-transform duration-200 ease-out ${desktopMenu === "more" ? "scale-100" : "scale-[.985]"}`}>
                  <div className="grid gap-1">
                    {moreLinks.map(([href, label, description]) => (
                      <a key={href} href={href} className="rounded-[18px] px-4 py-3 transition-all duration-150 hover:translate-x-0.5 hover:bg-[#EFE8E2]">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">{description}</span>
                      </a>
                    ))}
                    <button type="button" onClick={openSupport} className="rounded-[18px] px-4 py-3 text-left transition-all duration-150 hover:translate-x-0.5 hover:bg-[#EFE8E2]">
                      <span className="block text-sm font-semibold">Need help?</span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">Open support without leaving the page.</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            {!user ? (
              <a href="/login" className="rounded-full px-3 py-2 text-xs font-semibold text-[#3F3027]/65 hover:bg-[#EFE8E2] hover:text-[#171411]">Login</a>
            ) : (
              <a href="/account" className="rounded-full px-3 py-2 text-xs font-semibold text-[#3F3027]/72 hover:bg-[#EFE8E2] hover:text-[#171411]">Account</a>
            )}
            {staff && <a href="/admin/dashboard" className="rounded-full px-3 py-2 text-xs font-semibold text-[#7B5C4B]">Staff</a>}
            {owner && <a href="/owner/dashboard" className="rounded-full px-3 py-2 text-xs font-semibold text-[#7B5C4B]">Owner</a>}
            <a href="/#book" className="rounded-full bg-[#3F3027] px-5 py-3 text-xs font-semibold text-[#F7F5F2] shadow-md shadow-black/10">
              Book now
            </a>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full border border-[#3F3027]/12 bg-[#F7F5F2]/90 px-4 py-2.5 text-xs font-semibold text-[#171411] shadow-sm lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div
          id="mobile-site-menu"
          aria-hidden={!menuOpen}
          className={`mobile-menu-shell mx-auto mt-2 max-w-7xl rounded-[24px] border border-[#C0AB9A]/45 bg-[#F7F5F2]/98 text-[#171411] shadow-[0_24px_70px_rgba(23,20,17,.18)] backdrop-blur-2xl lg:hidden ${menuOpen ? "mobile-menu-shell-open" : ""}`}
        >
          <div className="mobile-menu-scroll max-h-[70dvh] overflow-y-auto px-5 py-5 pb-24">
            <nav className="grid gap-1 text-base">
              <a href="/" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3.5 font-semibold text-[#171411]">Home</a>
              {mainLinks.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3.5 text-[#3F3027]/70 hover:bg-[#EFE8E2] hover:text-[#171411]">{label}</a>
              ))}

              <button
                type="button"
                aria-expanded={mobileServiceOpen}
                aria-controls="mobile-service-menu"
                onClick={() => setMobileServiceOpen((value) => !value)}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[#3F3027]/70 hover:bg-[#EFE8E2] hover:text-[#171411]"
              >
                <span>Service</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 transition-transform duration-300 ${mobileServiceOpen ? "rotate-180" : ""}`}>
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div id="mobile-service-menu" className={`mobile-accordion ${mobileServiceOpen ? "mobile-accordion-open" : ""}`}>
                <div className="mobile-accordion-inner">
                  <div className="ml-3 grid gap-1 border-l border-[#C0AB9A]/45 pb-2 pl-3">
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7B5C4B]">Detailing</p>
                    {detailingLinks.map(([href, label]) => (
                      <a
                        key={href}
                        href={href}
                        onClick={() => {
                          setMenuOpen(false);
                          setMobileServiceOpen(false);
                        }}
                        className="rounded-2xl px-4 py-3 text-sm text-[#3F3027]/68 hover:bg-[#EFE8E2] hover:text-[#171411]"
                      >
                        {label}
                      </a>
                    ))}
                    <div className="mx-4 my-1 h-px bg-[#C0AB9A]/40" />
                    {specialtyLinks.map(([href, label]) => (
                      <a
                        key={href}
                        href={href}
                        onClick={() => {
                          setMenuOpen(false);
                          setMobileServiceOpen(false);
                        }}
                        className="rounded-2xl px-4 py-3 text-sm font-medium text-[#3F3027]/76 hover:bg-[#EFE8E2] hover:text-[#171411]"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                aria-expanded={mobileMoreOpen}
                aria-controls="mobile-more-menu"
                onClick={() => setMobileMoreOpen((value) => !value)}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[#3F3027]/70 hover:bg-[#EFE8E2] hover:text-[#171411]"
              >
                <span>More</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 transition-transform duration-300 ${mobileMoreOpen ? "rotate-180" : ""}`}>
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div id="mobile-more-menu" className={`mobile-accordion ${mobileMoreOpen ? "mobile-accordion-open" : ""}`}>
                <div className="mobile-accordion-inner">
                  <div className="ml-3 grid gap-1 border-l border-[#C0AB9A]/45 pb-2 pl-3">
                    {moreLinks.map(([href, label]) => (
                      <a
                        key={href}
                        href={href}
                        onClick={() => {
                          setMenuOpen(false);
                          setMobileMoreOpen(false);
                        }}
                        className="rounded-2xl px-4 py-3 text-sm text-[#3F3027]/68 hover:bg-[#EFE8E2] hover:text-[#171411]"
                      >
                        {label}
                      </a>
                    ))}
                    <button type="button" onClick={openSupport} className="rounded-2xl px-4 py-3 text-left text-sm text-[#3F3027]/68 hover:bg-[#EFE8E2] hover:text-[#171411]">
                      Need help?
                    </button>
                  </div>
                </div>
              </div>

              <div className="my-3 h-px bg-[#C0AB9A]/45" />

              {!user ? (
                <a href="/login" className="rounded-2xl px-4 py-3.5 text-[#3F3027]/72">Login</a>
              ) : (
                <a href="/account" className="rounded-2xl px-4 py-3.5 text-[#3F3027]/72">Account</a>
              )}
              {user && !owner && !staff && <a href="/dashboard" className="rounded-2xl px-4 py-3.5 text-[#3F3027]/72">My dashboard</a>}
              {staff && <a href="/admin/dashboard" className="rounded-2xl px-4 py-3.5 text-[#7B5C4B]">Staff dashboard</a>}
              {owner && <a href="/owner/dashboard" className="rounded-2xl px-4 py-3.5 text-[#7B5C4B]">Owner dashboard</a>}
              <a href="/#book" onClick={() => setMenuOpen(false)} className="mt-3 rounded-2xl bg-[#3F3027] px-5 py-4 text-center text-sm font-semibold text-[#F7F5F2]">
                Book now
              </a>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
