import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.27em]">Car Dash Detailing</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500">Mobile detailing based in South Elgin. Pick your package, send your request, and I’ll get back to you about the detail.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-neutral-400">
          <Link href="/services" className="hover:text-white">Services</Link>
          <Link href="/gallery" className="hover:text-white">Gallery</Link>
          <Link href="/reviews" className="hover:text-white">Reviews</Link>
          <Link href="/contact" className="hover:text-white">Book Now</Link>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-5 text-center text-xs text-neutral-600">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</div>
    </footer>
  );
}
