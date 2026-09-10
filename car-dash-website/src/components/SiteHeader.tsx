"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };

const publicLinks = [
  ["/", "Home"],
  ["/services", "Services"],
  ["/gallery", "Work"],
  ["/about", "About"],
  ["/faq", "FAQ"],
  ["/reviews", "Reviews"],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const logout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { window.location.assign("/"); }
  };

  const owner = Boolean(user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));

  return (
    <>
      <div className="bg-red-600 text-white">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between border-x border-white/15 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.24em] sm:px-8 lg:px-10">
          <span>South Elgin · Mobile Auto Detailing</span>
          <a href="/contact" className="hidden text-white/78 transition hover:text-white sm:block">Request a detail ↗</a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/94 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-5 border-x border-white/10 px-5 py-4 sm:px-8 lg:px-10">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-red-500/35 bg-red-600 text-[11px] font-black tracking-[-.06em]">CD</span>
            <div className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[-.025em]">Car Dash</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[.3em] text-white/30">Detailing</span>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-white/45 xl:flex">
            {publicLinks.map(([href, label]) => (
              <a key={href} href={href} className={`transition hover:text-white ${pathname === href ? "text-white" : ""}`}>{label}</a>
            ))}
            {user && !owner && <a href="/dashboard" className="text-white/75 transition hover:text-white">Dashboard</a>}
            {user && !owner && <a href="/account" className="text-white/75 transition hover:text-white">Account</a>}
            {owner && <a href="/owner/dashboard" className="text-red-400 transition hover:text-red-300">Owner</a>}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            {!user ? <a href="/login" className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/65 transition hover:border-white/35 hover:text-white">Login</a> : <button onClick={logout} className="px-3 text-xs font-semibold text-white/35 hover:text-white">Logout</button>}
            <a href="/contact" className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500">Book Now</a>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold xl:hidden">{menuOpen ? "Close" : "Menu"}</button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#080808] px-5 py-4 sm:px-8 xl:hidden">
            <nav className="flex flex-col text-sm text-white/60">
              {publicLinks.map(([href, label]) => <a key={href} href={href} className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white">{label}</a>)}
              <a href="/contact" className="rounded-xl px-3 py-3 hover:bg-white/5 hover:text-white">Book</a>
              {!user && <a href="/login" className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5">Login</a>}
              {user && !owner && <a href="/dashboard" className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5">Dashboard</a>}
              {user && !owner && <a href="/account" className="rounded-xl px-3 py-3 hover:bg-white/5">Account</a>}
              {owner && <a href="/owner/dashboard" className="rounded-xl px-3 py-3 text-red-400 hover:bg-white/5">Owner Dashboard</a>}
              {user && <button onClick={logout} className="rounded-xl px-3 py-3 text-left hover:bg-white/5">Logout</button>}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
