"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter() {
  const [blurb, setBlurb] = useState(SITE_DEFAULTS.footerBlurb);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data?.footerBlurb && setBlurb(data.footerBlurb))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#0D0D0D] text-white">
      <div className="mx-auto grid max-w-[1540px] gap-12 border-x border-white/10 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-10">
        <div>
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#FF2D2D] shadow-[0_0_14px_rgba(255,45,45,.55)]" /><p className="text-3xl font-semibold tracking-[-.045em]">Car Dash Detailing</p></div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/42">{blurb}</p>
          <div className="mt-7"><SocialLinks /></div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Explore</p>
            <div className="space-y-2 text-white/65"><a href="/about" className="block hover:text-[#FF2D2D]">About Car Dash</a><a href="/paint-correction" className="block hover:text-[#FF2D2D]">Paint Correction</a><a href="/ceramic-coatings" className="block hover:text-[#FF2D2D]">Ceramic Coatings</a><a href="/products-we-use" className="block hover:text-[#FF2D2D]">Products We Use</a><a href="/gallery" className="block hover:text-[#FF2D2D]">Gallery</a></div>
          </div>
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Services + Help</p>
            <div className="space-y-2 text-white/65"><a href="/services#car-detailing" className="block hover:text-[#FF2D2D]">Car Detailing</a><a href="/services#car-add-ons" className="block hover:text-[#FF2D2D]">Car Add-Ons</a><a href="/marine-detailing" className="block hover:text-[#FF2D2D]">Marine Detailing</a><a href="/marine-detailing#marine-add-ons" className="block hover:text-[#FF2D2D]">Marine Add-Ons</a><a href="/faq" className="block hover:text-[#FF2D2D]">FAQ</a><a href="/reviews" className="block hover:text-[#FF2D2D]">Reviews</a><a href="/contact" className="block hover:text-[#FF2D2D]">Book</a></div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Contact + Legal</p>
            <div className="space-y-2 text-white/65"><a href="mailto:cardashdetailing@gmail.com" className="block break-all hover:text-[#FF2D2D]">cardashdetailing@gmail.com</a><a href="/privacy-policy" className="block hover:text-[#FF2D2D]">Privacy Policy</a><a href="/terms-and-conditions" className="block hover:text-[#FF2D2D]">Terms and Conditions</a></div>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1540px] flex-col gap-2 border-x border-t border-white/10 px-5 py-5 text-[10px] uppercase tracking-[.2em] text-white/28 sm:flex-row sm:justify-between sm:px-8 lg:px-10"><span>South Elgin, Illinois</span><span>Mobile auto + marine detailing</span></div>
    </footer>
  );
}
