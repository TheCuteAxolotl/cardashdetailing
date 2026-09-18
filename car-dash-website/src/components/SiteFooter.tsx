import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY } from "@/lib/constants";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter({ blurb }: { blurb: string }) {
  return (
    <footer className="border-t border-white/8 bg-[#0B1822] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#6EAEC6]" /><p className="text-2xl font-semibold tracking-[-.04em]">Car Dash Detailing</p></div>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/42">{blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="/#prices" className="rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/70">Prices</a><a href="/#book" className="rounded-full bg-[#6EAEC6] px-4 py-2.5 text-sm font-bold text-white">Book now</a><a href="/quote" className="rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/70">Exact quote</a></div>
            <div className="mt-6"><SocialLinks /></div>
          </div>

          <div className="grid grid-cols-2 gap-7 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/28">Main</p>
              <div className="space-y-2 text-white/60"><a href="/#prices" className="block hover:text-white">Prices</a><a href="/#book" className="block hover:text-white">Book</a><a href="/gallery" className="block hover:text-white">Gallery</a><a href="/reviews" className="block hover:text-white">Reviews</a><a href="/faq" className="block hover:text-white">FAQ</a></div>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/28">More</p>
              <div className="space-y-2 text-white/60"><a href="/about" className="block hover:text-white">About</a><a href="/paint-correction" className="block hover:text-white">Paint Correction</a><a href="/ceramic-coatings" className="block hover:text-white">Ceramic Coating</a><a href="/marine-detailing" className="block hover:text-white">Marine</a></div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/28">Contact</p>
              <div className="space-y-2 text-white/60"><a href={`tel:${BUSINESS_PHONE}`} className="block hover:text-white">{BUSINESS_PHONE_DISPLAY}</a><a href="mailto:cardashdetailing@gmail.com" className="block break-all hover:text-white">cardashdetailing@gmail.com</a><a href="/privacy-policy" className="block hover:text-white">Privacy</a><a href="/terms-and-conditions" className="block hover:text-white">Terms</a></div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-[10px] uppercase tracking-[.16em] text-white/26 sm:flex-row sm:justify-between sm:px-8"><span>South Elgin, Illinois</span><span>Mobile detailing</span></div></div>
    </footer>
  );
}
