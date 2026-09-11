"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { OWNER_EMAIL } from "@/lib/constants";

type User = { id: string; name: string; email: string; role: string };
type Service = { id:string; title:string; category:string; subcategory:string; pricingType:string; active:boolean };

const publicLinks = [["/", "Home"],["/gallery", "Gallery"],["/faq", "FAQ"],["/reviews", "Reviews"],["/contact", "Contact"]] as const;
const exploreLinks = [
  ["/about", "About Car Dash", "Who we are and how the service works."],
  ["/paint-correction", "Paint Correction", "How polishing, correction levels, and paint refinement work."],
  ["/ceramic-coatings", "Ceramic Coatings", "GYEON Synchro, Gtechniq, and coating care."],
  ["/products-we-use", "Products We Use", "Professional chemistry led by Koch-Chemie."],
] as const;

function isMarineService(service: Service) {
  return `${service.category} ${service.subcategory} ${service.title}`.toLowerCase().includes("marine");
}

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(async r => r.ok ? r.json() : null).then(d => setUser(d?.user || null)).catch(() => setUser(null));
    fetch("/api/services", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(d => setServices(Array.isArray(d) ? d.filter((x:Service)=>x.active) : [])).catch(()=>setServices([]));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("mobile-nav-open");
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove("mobile-nav-open");
    };
  }, [menuOpen]);

  const { carServices, marineServices } = useMemo(() => {
    const marine = services.filter(isMarineService);
    const car = services.filter((service) => !isMarineService(service));
    return { carServices: car, marineServices: marine };
  }, [services]);

  const cancelMenuClose = () => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
  };

  const scheduleMenuClose = (menu: "services" | "explore") => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => {
      if (menu === "services") setServicesOpen(false);
      if (menu === "explore") setExploreOpen(false);
      menuCloseTimer.current = null;
    }, 320);
  };

  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/"); } };
  const openSupport = () => { window.dispatchEvent(new Event("open-support")); setMenuOpen(false); };
  const owner = Boolean(user && (user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));
  const admin = Boolean(user && user.role === "admin");
  const exploreActive = exploreLinks.some(([href]) => pathname === href);
  const servicesActive = pathname.startsWith("/services") || pathname.startsWith("/marine-detailing");

  return <>
    <div className="bg-[#FF2D2D] text-[#0D0D0D]"><div className="mx-auto flex max-w-[1540px] items-center justify-between border-x border-black/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.24em] sm:px-8 lg:px-10"><span>Mobile Auto + Marine Detailing</span><a href="/estimate" className="hidden opacity-75 sm:block">Get an instant estimate ↗</a></div></div>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0D0D0D]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-5 border-x border-white/10 px-5 py-4 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#FF2D2D]/35 bg-[#FF2D2D] text-[11px] font-black text-[#0D0D0D] shadow-[0_0_28px_rgba(255,45,45,.14)]">CD</span><div className="leading-none"><span className="block text-[15px] font-semibold">Car Dash</span><span className="mt-1 block text-[9px] uppercase tracking-[.3em] text-white/30">Detailing</span></div></a>
        <nav className="hidden items-center gap-6 text-[13px] font-medium text-white/50 xl:flex">
          <a href="/" className={pathname==="/"?"text-white":"hover:text-[#FF2D2D]"}>Home</a>

          <div className="static" onMouseEnter={()=>{cancelMenuClose();setServicesOpen(true);setExploreOpen(false)}} onMouseLeave={()=>scheduleMenuClose("services")}>
            <button onClick={()=>{setServicesOpen(v=>!v);setExploreOpen(false)}} className={`py-3 ${servicesActive?'text-[#FF2D2D]':'hover:text-[#FF2D2D]'}`}>Services ▾</button>
            {servicesOpen && <div onMouseEnter={cancelMenuClose} onMouseLeave={()=>scheduleMenuClose("services")} className="menu-pop-right absolute right-5 top-full max-h-[calc(100vh-96px)] w-[min(860px,calc(100vw-40px))] overflow-y-auto rounded-[28px] border border-[#FF2D2D]/15 bg-[#0D0D0D]/98 p-6 shadow-[0_28px_90px_rgba(0,0,0,.55)] sm:right-8 lg:right-10">
              <div className="grid gap-5 md:grid-cols-[1fr_1fr_.78fr]">
                <div className="rounded-[22px] border border-white/8 bg-white/[.018] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#FF2D2D]">Car Detailing</p>
                  <div className="space-y-1">
                    {(carServices.length ? carServices.slice(0, 8) : [
                      {id:"car-packages",title:"Package Detailing"},
                      {id:"car-exterior",title:"Exterior Detailing"},
                      {id:"car-interior",title:"Interior Detailing"},
                      {id:"car-correction",title:"Paint Correction"},
                    ]).map((service:any)=><a key={service.id} href={carServices.length ? `/services#${service.id}` : "/services#car-detailing"} className="block rounded-xl px-2 py-1.5 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">{service.title}</a>)}
                  </div>
                  <a href="/services#car-add-ons" className="mt-3 block rounded-xl border border-[#FF2D2D]/15 bg-[#FF2D2D]/[.05] px-3 py-2 text-sm text-[#FF2D2D]">Car Add-Ons + Pricing →</a>
                </div>

                <div className="rounded-[22px] border border-white/8 bg-white/[.018] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#FF2D2D]">Marine Detailing</p>
                  <div className="space-y-1">
                    {(marineServices.length ? marineServices.slice(0, 8) : [
                      {id:"marine-maintenance",title:"Marine Maintenance"},
                      {id:"marine-complete",title:"Complete Marine Detail"},
                      {id:"marine-enhancement",title:"Marine Enhancement"},
                      {id:"marine-ceramic",title:"Marine Ceramic Protection"},
                    ]).map((service:any)=><a key={service.id} href={marineServices.length ? `/marine-detailing#${service.id}` : "/marine-detailing#marine-services"} className="block rounded-xl px-2 py-1.5 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">{service.title}</a>)}
                  </div>
                  <a href="/marine-detailing#marine-add-ons" className="mt-3 block rounded-xl border border-[#FF2D2D]/15 bg-[#FF2D2D]/[.05] px-3 py-2 text-sm text-[#FF2D2D]">Marine Add-Ons + Pricing →</a>
                </div>

                <div className="rounded-[22px] border border-white/8 bg-[#4A5568]/10 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-white/35">Quick Links</p>
                  <a href="/paint-correction" className="block rounded-xl px-2 py-2 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Paint Correction Guide</a>
                  <a href="/ceramic-coatings" className="block rounded-xl px-2 py-2 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Ceramic Coatings</a>
                  <a href="/services" className="block rounded-xl px-2 py-2 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Car Services</a>
                  <a href="/marine-detailing" className="block rounded-xl px-2 py-2 text-sm text-white/70 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Marine Services</a>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-5"><a href="/estimate" className="rounded-full bg-[#FF2D2D] px-5 py-2.5 text-sm font-semibold text-[#0D0D0D]">Get an Estimate</a><a href="/quote" className="rounded-full border border-white/15 bg-white/[.03] px-5 py-2.5 text-sm font-semibold">Chat to a Specialist</a><a href="/services" className="ml-auto px-3 py-2.5 text-sm text-white/50 hover:text-[#FF2D2D]">Car services →</a><a href="/marine-detailing" className="px-3 py-2.5 text-sm text-white/50 hover:text-[#FF2D2D]">Marine services →</a></div>
            </div>}
          </div>

          <div className="static" onMouseEnter={()=>{cancelMenuClose();setExploreOpen(true);setServicesOpen(false)}} onMouseLeave={()=>scheduleMenuClose("explore")}>
            <button onClick={()=>{setExploreOpen(v=>!v);setServicesOpen(false)}} className={`py-3 ${exploreActive?'text-[#FF2D2D]':'hover:text-[#FF2D2D]'}`}>Explore ▾</button>
            {exploreOpen && <div onMouseEnter={cancelMenuClose} onMouseLeave={()=>scheduleMenuClose("explore")} className="menu-pop absolute left-1/2 top-full max-h-[calc(100vh-96px)] w-[min(460px,calc(100vw-32px))] overflow-y-auto rounded-[26px] border border-[#FF2D2D]/15 bg-[#0D0D0D]/98 p-4 shadow-[0_28px_90px_rgba(0,0,0,.55)]">
              <p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[.25em] text-[#FF2D2D]">Car Dash Guide</p>
              <div className="space-y-1">{exploreLinks.map(([href,label,desc])=><a key={href} href={href} className="block rounded-2xl border border-transparent px-3 py-3 hover:border-[#FF2D2D]/20 hover:bg-[#FF2D2D]/[.06]"><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-white/38">{desc}</span></a>)}</div>
            </div>}
          </div>

          {publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className={pathname===href?"text-white":"hover:text-[#FF2D2D]"}>{label}</a>)}
          <button onClick={openSupport} className="hover:text-[#FF2D2D]">Support</button>
          {user&&!owner&&!admin&&<><a href="/dashboard" className="text-white/80 hover:text-[#FF2D2D]">Dashboard</a><a href="/vehicles" className="text-white/80 hover:text-[#FF2D2D]">Vehicles</a></>}
          {admin&&<a href="/admin/dashboard" className="text-[#FF2D2D]">Admin</a>}{owner&&<a href="/owner/dashboard" className="text-[#FF2D2D]">Owner</a>}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">{!user?<a href="/login" className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2.5 text-xs font-semibold text-white/70 hover:border-[#FF2D2D]/40 hover:bg-[#FF2D2D]/10 hover:text-[#FF2D2D]">Login</a>:<button onClick={logout} className="rounded-full px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white">Logout</button>}<a href="/estimate" className="rounded-full bg-[#FF2D2D] px-5 py-2.5 text-xs font-semibold text-[#0D0D0D]">Get Estimate</a></div>
        <button onClick={()=>setMenuOpen(!menuOpen)} className="rounded-full border border-white/15 bg-white/[.025] px-4 py-2 text-xs font-semibold hover:border-[#FF2D2D]/40 hover:text-[#FF2D2D] xl:hidden">{menuOpen?"Close":"Menu"}</button>
      </div>

      {menuOpen&&<div className="mobile-menu-scroll max-h-[68dvh] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0D0D0D] px-5 py-4 pb-24 xl:hidden">
        <nav className="flex flex-col text-sm text-white/65">
          <a href="/" className="rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Home</a>

          <div className="mt-2 overflow-hidden rounded-[20px] border border-white/10 bg-white/[.018]">
            <button type="button" aria-expanded={mobileServicesOpen} onClick={()=>setMobileServicesOpen(v=>!v)} className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold text-white">
              <span>Services</span><span className={`text-[#FF2D2D] transition-transform duration-300 ${mobileServicesOpen?'rotate-180':''}`}>⌄</span>
            </button>
            {mobileServicesOpen&&<div className="mobile-accordion-pop border-t border-white/8 px-3 pb-3 pt-2">
              <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.24em] text-white/25">Car Detailing</p>
              <a href="/services" className="block rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Car Detailing Services</a>
              <a href="/services#car-add-ons" className="block rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Car Add-Ons + Pricing</a>
              <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[.24em] text-white/25">Marine Detailing</p>
              <a href="/marine-detailing" className="block rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Marine Detailing Services</a>
              <a href="/marine-detailing#marine-add-ons" className="block rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Marine Add-Ons + Pricing</a>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <a href="/estimate" className="rounded-xl bg-[#FF2D2D]/10 px-3 py-3 text-[#FF2D2D]">Get an Estimate</a>
                <a href="/quote" className="rounded-xl border border-white/10 px-3 py-3 hover:border-[#FF2D2D]/30 hover:text-[#FF2D2D]">Chat to a Specialist</a>
              </div>
            </div>}
          </div>

          <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-white/[.018]">
            <button type="button" aria-expanded={mobileExploreOpen} onClick={()=>setMobileExploreOpen(v=>!v)} className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold text-white">
              <span>Explore</span><span className={`text-[#FF2D2D] transition-transform duration-300 ${mobileExploreOpen?'rotate-180':''}`}>⌄</span>
            </button>
            {mobileExploreOpen&&<div className="mobile-accordion-pop border-t border-white/8 px-3 pb-3 pt-2">
              {exploreLinks.map(([href,label,desc])=><a key={href} href={href} className="block rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8"><span className="block text-white/80">{label}</span><span className="mt-1 block text-xs leading-5 text-white/32">{desc}</span></a>)}
            </div>}
          </div>

          <div className="mt-3 grid gap-1">
            {publicLinks.slice(1).map(([href,label])=><a key={href} href={href} className="rounded-xl px-3 py-3 hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">{label}</a>)}
            <button onClick={openSupport} className="rounded-xl px-3 py-3 text-left hover:bg-[#FF2D2D]/8 hover:text-[#FF2D2D]">Support</button>
            {!user&&<a href="/login" className="rounded-xl px-3 py-3 text-[#FF2D2D] hover:bg-[#FF2D2D]/8">Login</a>}
            {user&&!owner&&!admin&&<><a href="/dashboard" className="rounded-xl px-3 py-3">Dashboard</a><a href="/vehicles" className="rounded-xl px-3 py-3">Saved Vehicles</a></>}
            {admin&&<a href="/admin/dashboard" className="rounded-xl px-3 py-3 text-[#FF2D2D]">Admin Dashboard</a>}
            {owner&&<a href="/owner/dashboard" className="rounded-xl px-3 py-3 text-[#FF2D2D]">Owner Dashboard</a>}
            {user&&<button onClick={logout} className="rounded-xl px-3 py-3 text-left">Logout</button>}
          </div>
        </nav>
      </div>}
    </header>
  </>;
}
