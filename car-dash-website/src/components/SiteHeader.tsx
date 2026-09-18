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
            <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-[#3F3027]/10 bg-[#F7F5F2] shadow-sm">
              <Image src="/car-dash-logo.png" alt="Car Dash Detailing" width={96} height={96} priority className="h-8 w-8 object-contain" />
            </span>
            <span className="hidden text-sm font-semibold tracking-[-.025em] text-[#171411] sm:block">Car Dash Detailing</span>
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-[#3F3027]/10 bg-[#EFE8E2]/70 p-1 text-sm font-medium text-[#3F3027]/72 lg:flex">
            {mainLinks.map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 transition-colors hover:bg-[#F7F5F2] hover:text-[#171411] hover:shadow-sm">
                {label}
              </a>
            ))}

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full px-4 py-2 transition-colors hover:bg-[#F7F5F2] hover:text-[#171411] hover:shadow-sm [&::-webkit-details-marker]:hidden">
                More
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180">
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>

              <div className="absolute left-1/2 top-[calc(100%+18px)] z-[70] w-[330px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#C0AB9A]/55 bg-[#F7F5F2]/96 p-2 text-[#171411] shadow-[0_28px_80px_rgba(23,20,17,.18)] backdrop-blur-2xl">
                <div className="grid gap-1">
                  {moreLinks.map(([href, label, description]) => (
                    <a key={href} href={href} className="rounded-[18px] px-4 py-3 transition-colors hover:bg-[#EFE8E2]">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">{description}</span>
                    </a>
                  ))}
                  <button type="button" onClick={openSupport} className="rounded-[18px] px-4 py-3 text-left transition-colors hover:bg-[#EFE8E2]">
                    <span className="block text-sm font-semibold">Need help?</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#3F3027]/58">Open support without leaving the page.</span>
                  </button>
                </div>
              </div>
            </details>
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
