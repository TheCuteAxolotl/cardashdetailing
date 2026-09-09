import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070707] text-neutral-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Car Dash Detailing</p>
          <p className="mt-2 text-xs text-neutral-500">Mobile detailing based in South Elgin, Illinois.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <Link href="/services" className="transition hover:text-[#ef233c]">Services</Link>
          <Link href="/gallery" className="transition hover:text-[#ef233c]">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-[#ef233c]">Reviews</Link>
          <Link href="/contact" className="transition hover:text-[#ef233c]">Book</Link>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-5 text-center text-xs text-neutral-600">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</div>
    </footer>
  );
}
