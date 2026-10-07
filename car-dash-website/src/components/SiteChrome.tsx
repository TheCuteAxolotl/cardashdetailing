"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SupportWidget from "@/components/SupportWidget";
import ScrollReveal from "@/components/ScrollReveal";

const INTERNAL_PREFIXES = [
  "/owner",
  "/admin",
  "/dashboard",
  "/account",
  "/login",
  "/register",
  "/staff-guide",
  "/booking-chat",
  "/invoice",
];

export default function SiteChrome({ children, footerBlurb }: { children: ReactNode; footerBlurb: string }) {
  const pathname = usePathname();
  const internal = INTERNAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (internal) {
    return <div className="min-h-screen bg-[#0d0d0d] text-[#f5f3ef]">{children}</div>;
  }

  const showMobileActions = pathname !== "/quote" && pathname !== "/contact";

  return (
    <>
      <SiteHeader />
      <ScrollReveal />
      <div className={`public-clean flex-1 ${showMobileActions ? "pb-20 sm:pb-0" : ""}`}>{children}</div>
      <SiteFooter blurb={footerBlurb} />
      <SupportWidget />
      {showMobileActions && (
        <div className="mobile-booking-bar fixed inset-x-0 bottom-0 z-[65] border-t border-black/[.08] bg-[#faf9f7]/94 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_36px_rgba(23,20,17,.10)] backdrop-blur-2xl sm:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-[1fr_.86fr] gap-2">
            <a href="/#book" className="rounded-full bg-[#171411] px-4 py-3 text-center text-sm font-semibold text-white">Book a detail</a>
            <a href="/quote" className="rounded-full border border-black/10 bg-white px-4 py-3 text-center text-sm font-semibold text-[#171411]">Exact quote</a>
          </div>
        </div>
      )}
    </>
  );
}
