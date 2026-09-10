"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

const locations = ["South Elgin", "Geneva", "St. Charles", "Naperville"];
const workEmail = "cardashdetailing@gmail.com";

export default function SiteFooter() {
  const [blurb, setBlurb] = useState(SITE_DEFAULTS.footerBlurb);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.footerBlurb && setBlurb(data.footerBlurb))
      .catch(() => undefined);
  }, []);

  return (
    <footer className="bg-[#070707] text-white">
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-[1480px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.35fr_.65fr_.65fr] lg:px-12">
          <div>
            <p className="text-xl font-semibold tracking-[-0.03em]">Car Dash Detailing</p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/40">{blurb}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500">Book a Detail</Link>
              <a href={`mailto:${workEmail}`} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/65 hover:text-white">Email</a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Explore</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/50">
              <Link href="/services" className="hover:text-white">Services</Link>
              <Link href="/gallery" className="hover:text-white">Gallery</Link>
              <Link href="/reviews" className="hover:text-white">Reviews</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <Link href="/login" className="hover:text-white">Login</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Service area</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/50">
              {locations.map((location) => <span key={location}>{location}, IL</span>)}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/25">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</div>
    </footer>
  );
}
