"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

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

  const owner =
    user &&
    (user.role === "owner" ||
      user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());

  return (
    <>
      <div className="border-b border-red-500/15 bg-red-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] sm:px-6 sm:text-[11px]">
          <span>South Elgin • Mobile Detailing</span>

          <Link
            href="/contact"
            className="hidden underline-offset-4 hover:underline sm:inline"
          >
            Request a Detail →
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Car Dash Detailing"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div>
              <span className="block text-sm font-black uppercase tracking-[0.22em]">
                Car Dash
              </span>

              <span className="block text-[9px] font-bold uppercase tracking-[0.33em] text-neutral-500">
                Detailing
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-neutral-300 md:flex">
            <Link href="/" className="transition hover:text-red-400">
              Home
            </Link>

            <Link href="/services" className="transition hover:text-red-400">
              Services
            </Link>

            <Link href="/gallery" className="transition hover:text-red-400">
              Gallery
            </Link>

            <Link href="/reviews" className="transition hover:text-red-400">
              Reviews
            </Link>

            <Link href="/contact" className="transition hover:text-red-400">
              Contact
            </Link>

            {owner && (
              <Link
                href="/owner/dashboard"
                className="font-black text-red-400 transition hover:text-red-300"
              >
                Owner Dashboard
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user && (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-neutral-300 transition hover:border-red-500/40 hover:text-white"
              >
                Login
              </Link>
            )}

            {user && !owner && (
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-neutral-300 transition hover:border-red-500/40 hover:text-white"
              >
                Dashboard
              </Link>
            )}

            {user && (
              <button
                onClick={logout}
                className="text-xs font-bold text-neutral-500 transition hover:text-white"
              >
                Logout
              </button>
            )}

            <Link
              href="/contact"
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(220,38,38,.22)] transition hover:bg-red-500"
            >
              Book Now
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#070707] px-5 pb-6 sm:px-6 md:hidden">
            <nav className="flex flex-col gap-1 py-4 text-sm font-bold text-neutral-300">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-white/5"
              >
                Home
              </Link>

              <Link
                href="/services"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-white/5"
              >
                Services
              </Link>

              <Link
                href="/gallery"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-white/5"
              >
                Gallery
              </Link>

              <Link
                href="/reviews"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-white/5"
              >
                Reviews
              </Link>

              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-white/5"
              >
                Contact
              </Link>

              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                >
                  Login
                </Link>
              )}

              {user && !owner && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 hover:bg-white/5"
                >
                  Dashboard
                </Link>
              )}

              {owner && (
                <Link
                  href="/owner/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                >
                  Owner Dashboard
                </Link>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="rounded-xl px-3 py-3 text-left hover:bg-white/5"
                >
                  Logout
                </button>
              )}
            </nav>

            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="block rounded-full bg-red-600 px-5 py-3 text-center text-sm font-black"
            >
              Book Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
