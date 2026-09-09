"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const owner = user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600 shadow-[0_0_22px_rgba(220,38,38,.8)]" />
          <span className="text-sm font-black uppercase tracking-[0.27em]">Car Dash Detailing</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-300 md:flex">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <Link href="/services" className="transition hover:text-white">Services</Link>
          <Link href="/gallery" className="transition hover:text-white">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-white">Reviews</Link>
          {owner && <Link href="/owner/dashboard" className="font-black text-red-400 transition hover:text-red-300">Owner Dashboard</Link>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {owner && <button onClick={logout} className="text-sm font-semibold text-neutral-400 transition hover:text-white">Logout</button>}
          <Link href="/contact" className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500">Book Now</Link>
        </div>

        <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold md:hidden">
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#070707] px-6 pb-6 md:hidden">
          <nav className="flex flex-col gap-1 py-4 text-sm font-bold text-neutral-300">
            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/5">Home</Link>
            <Link href="/services" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/5">Services</Link>
            <Link href="/gallery" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/5">Gallery</Link>
            <Link href="/reviews" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/5">Reviews</Link>
            {owner && <Link href="/owner/dashboard" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5">Owner Dashboard</Link>}
            {owner && <button onClick={logout} className="rounded-xl px-3 py-3 text-left hover:bg-white/5">Logout</button>}
          </nav>
          <Link href="/contact" onClick={() => setMenuOpen(false)} className="block rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black">Book Now</Link>
        </div>
      )}
    </header>
  );
}
