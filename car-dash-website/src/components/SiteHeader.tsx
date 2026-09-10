"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setMenuOpen(false);
      window.location.assign("/");
    }
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
          <a
            href="/contact"
            className="hidden text-white/75 transition hover:text-white sm:inline"
          >
            Request a detail →
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <a href="/" className="group flex items-center gap-3">
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
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/48 md:flex">
            <a href="/" className="transition hover:text-white">Home</a>
            <a href="/services" className="transition hover:text-white">Services</a>
            <a href="/gallery" className="transition hover:text-white">Gallery</a>
            <a href="/reviews" className="transition hover:text-white">Reviews</a>
            <a href="/contact" className="transition hover:text-white">Contact</a>

            {user && !owner && (
              <>
                <a href="/dashboard" className="text-red-400 transition hover:text-red-300">
                  Dashboard
                </a>
                <a href="/account" className="transition hover:text-white">
                  Account
                </a>
              </>
            )}

            {owner && (
              <a href="/owner/dashboard" className="text-red-400 transition hover:text-red-300">
                Owner Dashboard
              </a>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user ? (
              <a
                href="/login"
                className="rounded-full border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/65 transition hover:border-white/30 hover:text-white"
              >
                Login
              </a>
            ) : (
              <button
                onClick={logout}
                className="px-2 text-xs font-semibold text-white/35 transition hover:text-white"
              >
                Logout
              </button>
            )}

            <a
              href="/contact"
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Book Now
            </a>
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
                <a
                  key={href}
                  href={href}
                  className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}

              {!user && (
                <a
                  href="/login"
                  className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                >
                  Login
                </a>
              )}

              {user && !owner && (
                <>
                  <a
                    href="/dashboard"
                    className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/account"
                    className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white"
                  >
                    Account
                  </a>
                </>
              )}

              {owner && (
                <a
                  href="/owner/dashboard"
                  className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5"
                >
                  Owner Dashboard
                </a>
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

            <a
              href="/contact"
              className="block rounded-full bg-red-600 px-5 py-3 text-center text-sm font-semibold"
            >
              Book Now
            </a>
          </div>
        )}
      </header>
    </>
  );
}
