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

  return (
    <>
      <SiteHeader />
      <ScrollReveal />
      <div className="public-clean flex-1">{children}</div>
      <SiteFooter blurb={footerBlurb} />
      <SupportWidget />
    </>
  );
}
