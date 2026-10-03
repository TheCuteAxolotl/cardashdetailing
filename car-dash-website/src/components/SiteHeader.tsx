"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY, OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

const mainLinks = [
  ["/#prices", "Prices"],
  ["/gallery", "Gallery"],
  ["/reviews", "Reviews"],
] as const;

const HOME_LOGO = "data:image/png;base64,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";

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
            <img
              src={HOME_LOGO}
              alt="Car Dash Detailing"
              width={140}
              height={140}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
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
