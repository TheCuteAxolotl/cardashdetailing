import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/services" className="transition hover:text-red-900">Services</Link>
          <Link href="/gallery" className="transition hover:text-red-900">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-red-900">Reviews</Link>
          <Link href="/contact" className="transition hover:text-red-900">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
