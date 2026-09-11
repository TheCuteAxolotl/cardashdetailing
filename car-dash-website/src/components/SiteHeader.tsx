"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };
type Service = { id:string; title:string; category:string; subcategory:string; pricingType:string; active:boolean };

const publicLinks = [["/", "Home"],["/gallery", "Gallery"],["/about", "About"],["/faq", "FAQ"],["/reviews", "Reviews"],["/contact", "Contact"]] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(async r => r.ok ? r.json() : null).then(d => setUser(d?.user || null)).catch(() => setUser(null));
    fetch("/api/services", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(d => setServices(Array.isArray(d) ? d.filter((x:Service)=>x.active) : [])).catch(()=>setServices([]));
  }, [pathname]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, Service[]>>();
    services.forEach(s => {
      if (!groups.has(s.category)) groups.set(s.category, new Map());
      const subs = groups.get(s.category)!;
      if (!subs.has(s.subcategory)) subs.set(s.subcategory, []);
      subs.get(s.subcategory)!.push(s);
    });
    return [...groups.entries()];
  }, [services]);

  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/"); } };
  const openSupport = () => { window.dispatchEvent(new Event("open-support")); setMenuOpen(false); };
  const owner = Boolean(user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));
  const admin = Boolean(user && user.role === "admin");

  return <>
    <div className="bg-red-600 text-white"><div className="mx-auto flex max-w-[1540px] items-center justify-between border-x border-white/15 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.24em] sm:px-8 lg:px-10"><span>South Elgin · Mobile Auto Detailing</span><a href="/estimate" className="hidden text-white/80 sm:block">Get an instant estimate ↗</a></div></div>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-5 border-x border-white/10 px-5 py-4 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-red-500/35 bg-red-600 text-[11px] font-black">CD</span><div className="leading-none"><span className="block text-[15px] font-semibold">Car Dash</span><span className="mt-1 block text-[9px] uppercase tracking-[.3em] text-white/30">Detailing</span></div></a>
        <nav className="hidden items-center gap-6 text-[13px] font-medium text-white/50 xl:flex">
          <a href="/" className={pathname==="/"?"text-white":"hover:text-white"}>Home</a>
          <div className="relative" onMouseEnter={()=>setServicesOpen(true)} onMouseLeave={()=>setServicesOpen(false)}>
            <button onClick={()=>setServicesOpen(v=>!v)} className={`py-3 ${pathname.startsWith('/services')?'text-white':'hover:text-white'}`}>Services ▾</button>
            {servicesOpen && <div className="absolute left-1/2 top-full w-[820px] -translate-x-1/2 rounded-[28px] border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
              <div className="grid gap-6 md:grid-cols-3">{grouped.length ? grouped.map(([category,subs]) => <div key={category}><p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-red-400">{category}</p>{[...subs.entries()].map(([sub,items])=><div key={sub} className="mb-4"><p className="mb-1 text-xs font-semibold text-white/40">{sub}</p>{items.map(s=><a key={s.id} href={`/services#${s.id}`} className="block rounded-xl px-2 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">{s.title}</a>)}</div>)}</div>) : <><div><p className="text-red-400">Car Detailing</p><a href="/services" className="mt-2 block text-white/70">Package Detailing</a><a href="/services" className="mt-2 block text-white/70">Exterior Detailing</a></div><div><p className="text-red-400">Marine Detailing</p><a href="/services" className="mt-2 block text-white/70">Interior / Exterior</a><a href="/services" className="mt-2 block text-white/70">Buff & Polish</a></div><div><p className="text-red-400">Ceramic Coatings</p><a href="/services" className="mt-2 block text-white/70">2 / 3 / 5 / 8 Year Options</a></div></>}</div>
              <div className="mt-5 flex gap-3 border-t border-white/10 pt-5"><a href="/estimate" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold">Get an Estimate</a><a href="/quote" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold">Chat to a Specialist</a><a href="/services" className="ml-auto px-3 py-2.5 text-sm text-white/50">View all services →</a></div>
            </div>}
          </div>
          {publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className={pathname===href?"text-white":"hover:text-white"}>{label}</a>)}
          <button onClick={openSupport} className="hover:text-white">Support</button>
          {user&&!owner&&!admin&&<><a href="/dashboard" className="text-white/80">Dashboard</a><a href="/vehicles" className="text-white/80">Vehicles</a></>}
          {admin&&<a href="/admin/dashboard" className="text-red-400">Admin</a>}{owner&&<a href="/owner/dashboard" className="text-red-400">Owner</a>}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">{!user?<a href="/login" className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/65">Login</a>:<button onClick={logout} className="px-3 text-xs text-white/40">Logout</button>}<a href="/estimate" className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold">Get Estimate</a></div>
        <button onClick={()=>setMenuOpen(!menuOpen)} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold xl:hidden">{menuOpen?"Close":"Menu"}</button>
      </div>
      {menuOpen&&<div className="border-t border-white/10 bg-[#080808] px-5 py-4 xl:hidden"><nav className="flex flex-col text-sm text-white/65"><a href="/" className="rounded-xl px-3 py-3">Home</a><a href="/services" className="rounded-xl px-3 py-3">Services</a><a href="/estimate" className="rounded-xl px-3 py-3 text-red-400">Get an Estimate</a><a href="/quote" className="rounded-xl px-3 py-3">Chat to a Specialist</a>{publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className="rounded-xl px-3 py-3">{label}</a>)}<button onClick={openSupport} className="rounded-xl px-3 py-3 text-left">Support</button>{!user&&<a href="/login" className="rounded-xl px-3 py-3 text-red-400">Login</a>}{user&&!owner&&!admin&&<><a href="/dashboard" className="rounded-xl px-3 py-3">Dashboard</a><a href="/vehicles" className="rounded-xl px-3 py-3">Saved Vehicles</a></>}{admin&&<a href="/admin/dashboard" className="rounded-xl px-3 py-3 text-red-400">Admin Dashboard</a>}{owner&&<a href="/owner/dashboard" className="rounded-xl px-3 py-3 text-red-400">Owner Dashboard</a>}{user&&<button onClick={logout} className="rounded-xl px-3 py-3 text-left">Logout</button>}</nav></div>}
    </header>
  </>;
}
