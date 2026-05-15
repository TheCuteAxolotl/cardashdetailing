import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-950">
          Car Dash Detailing
        </div>
        <nav className="hidden items-center gap-8 text-sm text-slate-700 md:flex">
          <Link href="/services" className="transition hover:text-red-900">Services</Link>
          <Link href="/gallery" className="transition hover:text-red-900">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-red-900">Reviews</Link>
          <Link href="/contact" className="transition hover:text-red-900">Contact</Link>
        </nav>
        <Link
          href="/contact"
          className="rounded-full border border-slate-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-black"
        >
          Book Now
        </Link>
      </div>
    </header>
  );
}
