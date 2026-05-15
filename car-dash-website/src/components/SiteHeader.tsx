import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#050505]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
          Car Dash Detailing
        </div>
        <nav className="hidden items-center gap-8 text-sm text-neutral-300 md:flex">
          <Link href="/services" className="transition hover:text-red-600">Services</Link>
          <Link href="/gallery" className="transition hover:text-red-600">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-red-600">Reviews</Link>
          <Link href="/contact" className="transition hover:text-red-600">Contact</Link>
        </nav>
        <Link
          href="/contact"
          className="rounded-full border border-neutral-800 bg-red-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
        >
          Book Now
        </Link>
      </div>
    </header>
  );
}
