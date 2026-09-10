import Link from "next/link";

const locations = ["South Elgin", "Geneva", "St. Charles", "Naperville"];
const workEmail = "cardashdetailing@gmail.com";

export default function SiteFooter() {
  return (
    <footer className="bg-[#050505] text-white">
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_.8fr_.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-sm font-black">CD</span>
              <div>
                <p className="text-base font-black uppercase tracking-[0.2em]">Car Dash</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-neutral-600">Detailing</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-neutral-400">
              Mobile detailing based in South Elgin, serving surrounding areas with convenient interior, exterior, and paint-care services.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-black transition hover:bg-red-500">
                Book Your Detail
              </Link>
              <a href={`mailto:${workEmail}`} className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-black transition hover:bg-white/5">
                Email Us
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Quick Links</p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-neutral-400">
              <Link href="/services" className="hover:text-white">Services</Link>
              <Link href="/gallery" className="hover:text-white">Gallery</Link>
              <Link href="/reviews" className="hover:text-white">Reviews</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <a href={`mailto:${workEmail}`} className="hover:text-white">{workEmail}</a>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Service Area</p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-neutral-400">
              {locations.map((location) => (
                <span key={location}>{location}, IL</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} Car Dash Detailing. All rights reserved.
      </div>
    </footer>
  );
}
