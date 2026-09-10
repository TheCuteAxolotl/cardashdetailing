import { SITE_DEFAULTS } from "@/lib/site-defaults";

export default function SiteFooter() {
  return <footer className="border-t border-black/10 bg-[#f2efe7] text-black">
    <div className="mx-auto grid max-w-[1540px] gap-10 border-x border-black/10 px-5 py-12 sm:px-8 lg:grid-cols-[1.3fr_.7fr] lg:px-10">
      <div><p className="text-3xl font-semibold tracking-[-.045em]">Car Dash Detailing</p><p className="mt-4 max-w-xl text-sm leading-7 text-black/48">{SITE_DEFAULTS.footerBlurb}</p></div>
      <div className="grid grid-cols-2 gap-8 text-sm"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-black/35">Navigate</p><div className="space-y-2"><a href="/services" className="block hover:opacity-55">Services</a><a href="/gallery" className="block hover:opacity-55">Work</a><a href="/reviews" className="block hover:opacity-55">Reviews</a></div></div><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.23em] text-black/35">Contact</p><a href="mailto:cardashdetailing@gmail.com" className="break-all hover:opacity-55">cardashdetailing@gmail.com</a></div></div>
    </div>
    <div className="mx-auto flex max-w-[1540px] justify-between border-x border-t border-black/10 px-5 py-5 text-[10px] uppercase tracking-[.2em] text-black/35 sm:px-8 lg:px-10"><span>South Elgin, Illinois</span><span>Mobile detailing</span></div>
  </footer>;
}
