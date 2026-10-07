"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SupportWidget from "@/components/SupportWidget";
import ScrollReveal from "@/components/ScrollReveal";

const STAFF_INTERNAL_PREFIXES = [
  "/owner",
  "/admin",
  "/staff-guide",
];

const CUSTOMER_PORTAL_PREFIXES = [
  "/dashboard",
  "/account",
  "/vehicles",
];

const QUIET_CUSTOMER_PREFIXES = [
  "/login",
  "/register",
  "/booking-chat",
  "/invoice",
];

export default function SiteChrome({ children, footerBlurb }: { children: ReactNode; footerBlurb: string }) {
  const pathname = usePathname();
  const [dockSuppressed, setDockSuppressed] = useState(false);
  const staffInternal = STAFF_INTERNAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const customerPortal = CUSTOMER_PORTAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const quietCustomer = QUIET_CUSTOMER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    const targets = [document.querySelector("#book"), document.querySelector("footer")].filter(Boolean) as Element[];
    if (!targets.length) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setDockSuppressed(visible.size > 0);
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pathname]);

  if (staffInternal) {
    return <div className="min-h-screen bg-[#0d0d0d] text-[#f5f3ef]">{children}</div>;
  }

  if (quietCustomer) {
    return <div className="min-h-screen bg-[#171411] text-[#f5f3ef]">{children}</div>;
  }

  if (customerPortal) {
    return (
      <div className="min-h-screen bg-[#171411] text-[#f5f3ef]">
        <header className="sticky top-0 z-50 border-b border-white/8 bg-[#171411]/92 backdrop-blur-2xl">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <a href="/" className="flex items-center gap-3">
              <img src="/favicon.png" alt="" className="h-8 w-8 rounded-full border border-white/12 bg-white/5 p-1" />
              <div>
                <span className="block text-xs font-semibold tracking-[.14em]">CAR DASH</span>
                <span className="mt-1 block text-[8px] uppercase tracking-[.2em] text-white/30">Client portal</span>
              </div>
            </a>
            <nav className="flex items-center gap-1 text-xs font-medium text-white/52 sm:gap-2">
              <a href="/dashboard" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white">Dashboard</a>
              <a href="/vehicles" className="hidden rounded-full px-3 py-2 hover:bg-white/5 hover:text-white sm:inline-flex">Vehicles</a>
              <a href="/account" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white">Account</a>
              <a href="/#book" className="ml-1 rounded-full bg-white px-3.5 py-2 text-[#171411]">Book</a>
            </nav>
          </div>
        </header>
        {children}
        <SupportWidget />
      </div>
    );
  }

  const showMobileActions = pathname !== "/quote" && pathname !== "/contact";

  return (
    <>
      <SiteHeader />
      <ScrollReveal />
      <div className="public-clean flex-1">{children}</div>
      <SiteFooter blurb={footerBlurb} />
      <SupportWidget />
      {showMobileActions && (
        <div className={`mobile-booking-bar fixed z-[65] sm:hidden ${dockSuppressed ? "mobile-booking-bar-hidden" : ""}`}>
          <div className="mobile-booking-inner mx-auto grid max-w-lg grid-cols-[1fr_.86fr] gap-2">
            <a href="/#book" className="mobile-book-primary rounded-full px-4 py-3 text-center text-sm font-semibold">Book a detail</a>
            <a href="/quote" className="mobile-book-secondary rounded-full px-4 py-3 text-center text-sm font-semibold">Exact quote</a>
          </div>
        </div>
      )}
    </>
  );
}
