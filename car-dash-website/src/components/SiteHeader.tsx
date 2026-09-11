"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };
type Service = { id:string; title:string; category:string; subcategory:string; pricingType:string; active:boolean };

const publicLinks = [["/", "Home"],["/gallery", "Gallery"],["/faq", "FAQ"],["/reviews", "Reviews"],["/contact", "Contact"]] as const;
const exploreLinks = [
  ["/about", "About Car Dash", "Who we are and how the service works."],
  ["/ceramic-coatings", "Ceramic Coatings", "GYEON Synchro, Gtechniq, and coating care."],
  ["/products-we-use", "Products We Use", "Professional chemistry led by Koch-Chemie."],
] as const;

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
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
  const exploreActive = exploreLinks.some(([href]) => pathname === href);

  return <>
    <div className="bg-[#00F2FE] text-[#0D0D0D]"><div className="mx-auto flex max-w-[1540px] items-center justify-between border-x border-black/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.24em] sm:px-8 lg:px-10"><span>Mobile Auto + Marine Detailing</span><a href="/estimate" className="hidden opacity-75 sm:block">Get an instant estimate ↗</a></div></div>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0D0D0D]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-5 border-x border-white/10 px-5 py-4 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#00F2FE]/35 bg-[#00F2FE] text-[11px] font-black text-[#0D0D0D] shadow-[0_0_28px_rgba(0,242,254,.14)]">CD</span><div className="leading-none"><span className="block text-[15px] font-semibold">Car Dash</span><span className="mt-1 block text-[9px] uppercase tracking-[.3em] text-white/30">Detailing</span></div></a>
        <nav className="hidden items-center gap-6 text-[13px] font-medium text-white/50 xl:flex">
          <a href="/" className={pathname==="/"?"text-white":"hover:text-[#00F2FE]"}>Home</a>

          <div className="relative" onMouseEnter={()=>{setServicesOpen(true);setExploreOpen(false)}} onMouseLeave={()=>setServicesOpen(false)}>
            <button onClick={()=>{setServicesOpen(v=>!v);setExploreOpen(false)}} className={`py-3 ${pathname.startsWith('/services')?'text-[#00F2FE]':'hover:text-[#00F2FE]'}`}>Services ▾</button>
            {servicesOpen && <div className="menu-pop absolute left-1/2 top-full w-[850px] -translate-x-1/2 rounded-[28px] border border-[#00F2FE]/15 bg-[#0D0D0D]/98 p-6 shadow-[0_28px_90px_rgba(0,0,0,.55)]">
              <div className="grid gap-6 md:grid-cols-3">{grouped.length ? grouped.map(([category,subs]) => <div key={category}><p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#00F2FE]">{category}</p>{[...subs.entries()].map(([sub,items])=><div key={sub} className="mb-4"><p className="mb-1 text-xs font-semibold text-white/40">{sub}</p>{items.map(s=><a key={s.id} href={`/services#${s.id}`} className="block rounded-xl px-2 py-1.5 text-sm text-white/70 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">{s.title}</a>)}</div>)}{category.toLowerCase().includes("marine") && <a href="/services#marine-add-ons" className="mt-1 block rounded-xl border border-[#00F2FE]/15 bg-[#00F2FE]/[.05] px-3 py-2 text-sm text-[#00F2FE]">Marine Add-Ons →</a>}</div>) : <><div><p className="text-[#00F2FE]">Car Detailing</p><a href="/services" className="mt-2 block text-white/70">Package Detailing</a><a href="/services" className="mt-2 block text-white/70">Exterior Detailing</a></div><div><p className="text-[#00F2FE]">Marine Detailing</p><a href="/services" className="mt-2 block text-white/70">Interior / Exterior</a><a href="/services" className="mt-2 block text-white/70">Buff & Polish</a><a href="/services#marine-add-ons" className="mt-2 block text-white/70">Marine Add-Ons</a></div><div><p className="text-[#00F2FE]">Ceramic Coatings</p><a href="/services" className="mt-2 block text-white/70">Coating Packages</a><a href="/ceramic-coatings" className="mt-2 block text-white/70">Learn about coatings</a></div></>}</div>
              <div className="mt-5 flex gap-3 border-t border-white/10 pt-5"><a href="/estimate" className="rounded-full bg-[#00F2FE] px-5 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get an Estimate</a><a href="/quote" className="rounded-full border border-white/15 bg-white/[.03] px-5 py-2.5 text-sm font-semibold">Chat to a Specialist</a><a href="/services" className="ml-auto px-3 py-2.5 text-sm text-white/50 hover:text-[#00F2FE]">View all services →</a></div>
            </div>}
          </div>

          <div className="relative" onMouseEnter={()=>{setExploreOpen(true);setServicesOpen(false)}} onMouseLeave={()=>setExploreOpen(false)}>
            <button onClick={()=>{setExploreOpen(v=>!v);setServicesOpen(false)}} className={`py-3 ${exploreActive?'text-[#00F2FE]':'hover:text-[#00F2FE]'}`}>Explore ▾</button>
            {exploreOpen && <div className="menu-pop absolute left-1/2 top-full w-[440px] -translate-x-1/2 rounded-[26px] border border-[#00F2FE]/15 bg-[#0D0D0D]/98 p-4 shadow-[0_28px_90px_rgba(0,0,0,.55)]">
              <p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[.25em] text-[#00F2FE]">Car Dash Guide</p>
              <div className="space-y-1">{exploreLinks.map(([href,label,desc])=><a key={href} href={href} className="block rounded-2xl border border-transparent px-3 py-3 hover:border-[#00F2FE]/20 hover:bg-[#00F2FE]/[.06]"><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-white/38">{desc}</span></a>)}</div>
            </div>}
          </div>

          {publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className={pathname===href?"text-white":"hover:text-[#00F2FE]"}>{label}</a>)}
          <button onClick={openSupport} className="hover:text-[#00F2FE]">Support</button>
          {user&&!owner&&!admin&&<><a href="/dashboard" className="text-white/80 hover:text-[#00F2FE]">Dashboard</a><a href="/vehicles" className="text-white/80 hover:text-[#00F2FE]">Vehicles</a></>}
          {admin&&<a href="/admin/dashboard" className="text-[#00F2FE]">Admin</a>}{owner&&<a href="/owner/dashboard" className="text-[#00F2FE]">Owner</a>}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">{!user?<a href="/login" className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2.5 text-xs font-semibold text-white/70 hover:border-[#00F2FE]/40 hover:bg-[#00F2FE]/10 hover:text-[#00F2FE]">Login</a>:<button onClick={logout} className="rounded-full px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white">Logout</button>}<a href="/estimate" className="rounded-full bg-[#00F2FE] px-5 py-2.5 text-xs font-semibold text-[#0D0D0D]">Get Estimate</a></div>
        <button onClick={()=>setMenuOpen(!menuOpen)} className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2 text-xs font-semibold hover:border-[#00F2FE]/40 hover:text-[#00F2FE] xl:hidden">{menuOpen?"Close":"Menu"}</button>
      </div>
      {menuOpen&&<div className="border-t border-white/10 bg-[#0D0D0D] px-5 py-4 xl:hidden"><nav className="flex flex-col text-sm text-white/65"><a href="/" className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">Home</a><a href="/services" className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">Services</a><a href="/services#marine-add-ons" className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">Marine Add-Ons</a><a href="/estimate" className="rounded-xl px-3 py-3 text-[#00F2FE] hover:bg-[#00F2FE]/8">Get an Estimate</a><a href="/quote" className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">Chat to a Specialist</a><p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.24em] text-white/25">Explore</p>{exploreLinks.map(([href,label])=><a key={href} href={href} className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">{label}</a>)}{publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className="rounded-xl px-3 py-3 hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">{label}</a>)}<button onClick={openSupport} className="rounded-xl px-3 py-3 text-left hover:bg-[#00F2FE]/8 hover:text-[#00F2FE]">Support</button>{!user&&<a href="/login" className="rounded-xl px-3 py-3 text-[#00F2FE] hover:bg-[#00F2FE]/8">Login</a>}{user&&!owner&&!admin&&<><a href="/dashboard" className="rounded-xl px-3 py-3">Dashboard</a><a href="/vehicles" className="rounded-xl px-3 py-3">Saved Vehicles</a></>}{admin&&<a href="/admin/dashboard" className="rounded-xl px-3 py-3 text-[#00F2FE]">Admin Dashboard</a>}{owner&&<a href="/owner/dashboard" className="rounded-xl px-3 py-3 text-[#00F2FE]">Owner Dashboard</a>}{user&&<button onClick={logout} className="rounded-xl px-3 py-3 text-left">Logout</button>}</nav></div>}
    </header>
  </>;
}
