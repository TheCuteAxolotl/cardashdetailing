import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-[#050505] text-neutral-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/services" className="transition hover:text-red-600">Services</Link>
          <Link href="/gallery" className="transition hover:text-red-600">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-red-600">Reviews</Link>
          <Link href="/contact" className="transition hover:text-red-600">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
