import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY } from "@/lib/constants";
import { BUSINESS_EMAIL } from "@/lib/seo";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter({ blurb }: { blurb: string }) {
  return (
    <footer className="border-t border-white/10 bg-[#171411] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
          <div>
            <p className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">CAR DASH</p>
            <p className="mt-3 text-[9px] font-semibold uppercase tracking-[.24em] text-white/32">South Elgin · Mobile detailing</p>
            <p className="mt-7 max-w-lg text-sm leading-7 text-white/44">{blurb}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/#book" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111]">Book a detail</a>
              <a href="/quote" className="rounded-full border border-white/16 px-5 py-3 text-sm font-medium text-white/72 hover:border-white/32 hover:text-white">Exact quote</a>
            </div>
            <div className="mt-7"><SocialLinks /></div>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.16em] text-white/28">Explore</p>
              <div className="space-y-3 text-white/52"><a href="/#prices" className="block hover:text-white">Pricing</a><a href="/gallery" className="block hover:text-white">Work</a><a href="/reviews" className="block hover:text-white">Reviews</a><a href="/about" className="block hover:text-white">About</a></div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.16em] text-white/28">Services</p>
              <div className="space-y-3 text-white/52"><a href="/car-detailing-packages" className="block hover:text-white">Detail packages</a><a href="/paint-correction" className="block hover:text-white">Paint correction</a><a href="/ceramic-coatings" className="block hover:text-white">Ceramic coating</a><a href="/marine-detailing" className="block hover:text-white">Marine</a></div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.16em] text-white/28">Contact</p>
              <div className="space-y-3 text-white/52"><a href={`tel:${BUSINESS_PHONE}`} className="block hover:text-white">{BUSINESS_PHONE_DISPLAY}</a><a href={`mailto:${BUSINESS_EMAIL}`} className="block break-all hover:text-white">{BUSINESS_EMAIL}</a><a href="/faq" className="block hover:text-white">FAQ</a><a href="/contact" className="block hover:text-white">Contact</a></div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[.08]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 text-[9px] uppercase tracking-[.16em] text-white/26 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>South Elgin, Illinois · Mobile service across Chicagoland</span>
          <div className="flex gap-5"><a href="/privacy-policy" className="hover:text-white/60">Privacy</a><a href="/terms-and-conditions" className="hover:text-white/60">Terms</a></div>
        </div>
      </div>
    </footer>
  );
}
