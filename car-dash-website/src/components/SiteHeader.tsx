"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });

    setUser(null);
    setMenuOpen(false);

    router.push("/");
    router.refresh();
  };

  const owner = Boolean(
    user &&
      (user.role === "owner" ||
        user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
  );

  return (
    <>
      <div className="border-b border-white/10 bg-red-600 text-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] sm:px-8 lg:px-12">
          <span>South Elgin • Mobile Detailing</span>

          <Link
            href="/contact"
            className="hidden text-white/75 transition hover:text-white sm:inline"
          >
            Request a detail →
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-red-500/40 bg-red-500/[0.08] text-xs font-semibold tracking-[-0.02em] text-red-400 transition group-hover:border-red-500 group-hover:bg-red-600 group-hover:text-white">
              CD
            </span>

            <div>
              <span className="block text-sm font-semibold tracking-[-0.01em]">
                Car Dash
              </span>

              <span className="block text-[9px] font-medium uppercase tracking-[0.28em] text-white/30">
                Detailing
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/48 md:flex">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>

            <Link href="/services" className="transition hover:text-white">
              Services
            </Link>

            <Link href="/gallery" className="transition hover:text-white">
              Gallery
            </Link>

            <Link href="/reviews" className="transition hover:text-white">
              Reviews
            </Link>

            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className="transition hover:text-white"
              >
                Dashboard
              </Link>
            )}

            {owner && (
              <Link
                href="/owner/dashboard"
                className="text-red-400 transition hover:text-red-300"
              >
                Owner Dashboard
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user ? (
              <Link
                href="/login"
                className="rounded-full border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/65 transition hover:border-white/30 hover:text-white"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={logout}
                className="px-2 text-xs font-semibold text-white/35 transition hover:text-white"
              >
                Logout
              </button>
            )}

            <Link
              href="/contact"
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Book Now
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/75 md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#080808] px-5 pb-6 sm:px-8 md:hidden">
            <nav className="flex flex-col py-4 text-sm font-medium text-white/55">
              {[
                ["/", "Home"],
                ["/services", "Services"],
                ["/gallery", "Gallery"],
                ["/reviews", "Reviews"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white"
                >
                  {label}
                </Link>
              ))}

              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                >
                  Login
                </Link>
              )}

              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white"
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
                  className="rounded-xl px-3 py-3 text-left hover:bg-white/5 hover:text-white"
                >
                  Logout
                </button>
              )}
            </nav>

            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="block rounded-full bg-red-600 px-5 py-3 text-center text-sm font-semibold"
            >
              Book Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
