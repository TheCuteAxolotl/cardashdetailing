"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter() {
  const [blurb, setBlurb] = useState(SITE_DEFAULTS.footerBlurb);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.footerBlurb && setBlurb(d.footerBlurb))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#070707] text-white">
      <div className="mx-auto grid max-w-[1540px] gap-12 border-x border-white/10 px-5 py-14 sm:px-8 lg:grid-cols-[1.25fr_.75fr] lg:px-10">
        <div>
          <p className="text-3xl font-semibold tracking-[-.045em]">Car Dash Detailing</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/42">{blurb}</p>
          <div className="mt-7"><SocialLinks /></div>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Explore</p><div className="space-y-2 text-white/65"><a href="/services" className="block hover:text-white">Services</a><a href="/gallery" className="block hover:text-white">Work</a><a href="/about" className="block hover:text-white">About</a></div></div>
          <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Help</p><div className="space-y-2 text-white/65"><a href="/faq" className="block hover:text-white">FAQ</a><a href="/reviews" className="block hover:text-white">Reviews</a><a href="/contact" className="block hover:text-white">Book</a><a href="/privacy-policy" className="block hover:text-white">Privacy Policy</a><a href="/terms-and-conditions" className="block hover:text-white">Terms and Conditions</a></div></div>
          <div className="col-span-2 sm:col-span-1"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-white/28">Contact</p><a href="mailto:cardashdetailing@gmail.com" className="break-all text-white/65 hover:text-white">cardashdetailing@gmail.com</a></div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1540px] flex-col gap-2 border-x border-t border-white/10 px-5 py-5 text-[10px] uppercase tracking-[.2em] text-white/28 sm:flex-row sm:justify-between sm:px-8 lg:px-10"><span>South Elgin, Illinois</span><span>Mobile detailing</span></div>
    </footer>
  );
}
