"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#050505]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-white hover:text-red-600 transition">
          Car Dash Detailing
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 transition hover:border-red-600 hover:text-red-600 md:hidden"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div className="hidden flex-1 items-center justify-between gap-4 md:flex">
          <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
            <Link href="/" className="transition hover:text-red-600">
              Home
            </Link>
            <Link href="/services" className="transition hover:text-red-600">
              Services
            </Link>
            {!loading && !user && (
              <>
                <Link href="/login" className="transition hover:text-red-600">
                  Login
                </Link>
                <Link href="/register" className="transition hover:text-red-600">
                  Register
                </Link>
                <Link href="/login" className="rounded-full border border-neutral-800 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800">
                  Owner Login
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link href="/dashboard" className="transition hover:text-red-600">
                  Dashboard
                </Link>
                {user.email === OWNER_EMAIL && (
                  <Link href="/owner/dashboard" className="transition hover:text-red-600">
                    Owner Dashboard
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            {!loading && user ? (
              <>
                <span className="text-sm text-neutral-400">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-neutral-300 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : null}
            <Link
              href="/contact"
              className="rounded-full border border-neutral-800 bg-red-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-800 bg-[#050505] px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 py-4 text-sm text-neutral-300">
            <Link href="/" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
              Home
            </Link>
            <Link href="/services" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
              Services
            </Link>
            {!loading && !user && (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
                  Register
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-full border border-neutral-800 bg-red-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-red-800">
                  Owner Login
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
                  Dashboard
                </Link>
                {user.email === OWNER_EMAIL && (
                  <Link href="/owner/dashboard" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-neutral-900 hover:text-red-600">
                    Owner Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left text-sm font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
          <Link
            href="/contact"
            className="block rounded-full border border-neutral-800 bg-red-700 px-5 py-3 text-center text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}
