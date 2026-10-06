import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY } from "@/lib/constants";
import { BUSINESS_EMAIL } from "@/lib/seo";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter({ blurb }: { blurb: string }) {
  return (
    <footer className="border-t border-white/10 bg-[#0f0f0f] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-xl font-bold tracking-[.05em]">CAR DASH</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">Mobile detailing</p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/42">{blurb}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/#book" className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-[#111]">Book an appointment</a>
              <a href="/quote" className="rounded-md border border-white/16 px-4 py-2.5 text-sm font-medium text-white/72 hover:border-white/32 hover:text-white">Request a quote</a>
            </div>
            <div className="mt-7"><SocialLinks /></div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
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
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 text-[10px] uppercase tracking-[.14em] text-white/24 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>South Elgin, Illinois · Mobile service across Chicagoland</span>
          <div className="flex gap-5"><a href="/privacy-policy" className="hover:text-white/60">Privacy</a><a href="/terms-and-conditions" className="hover:text-white/60">Terms</a></div>
        </div>
      </div>
    </footer>
  );
}
