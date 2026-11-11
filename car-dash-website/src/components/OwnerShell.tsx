"use client";

import WorkboardHome from "./WorkboardHome";
import { appearanceFor, employeePreview, savePreference, type Appearance } from "@/lib/workspace-preferences";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import OwnerActivityBell from "@/components/OwnerActivityBell";
import OwnerMobileBottomNav from "@/components/OwnerMobileBottomNav";
import StaffMobileBottomNav from "@/components/StaffMobileBottomNav";
import { useOwnerScreenPrivacy } from "@/lib/owner-screen-privacy";

type OwnerUser = { id: string; name?: string | null; email?: string | null; role?: string | null };

type IconName =
  | "home" | "chart" | "calendar" | "quote" | "message" | "invoice" | "phone"
  | "web" | "price" | "service" | "photo" | "clock" | "shield" | "book"
  | "people" | "settings" | "support" | "external" | "menu" | "close"
  | "search" | "plus" | "grid";

type NavItem = {
  href: string;
  adminHref?: string;
  label: string;
  icon: IconName;
  permissions?: string[];
  ownerOnly?: boolean;
};

const groups: Array<{ label: string; icon: IconName; items: NavItem[] }> = [
  {
    label: "Home",
    icon: "home",
    items: [{ href: "/owner/dashboard", adminHref: "/admin/dashboard", label: "Home", icon: "home" },
      { href: "/owner/workspace", label: "Command center", icon: "grid", ownerOnly: true },
      { href: "/owner/profile", adminHref: "/admin/profile", label: "My Profile", icon: "people" }],
  },
  {
    label: "Customers",
    icon: "people",
    items: [
      { href: "/owner/leads", label: "New leads", icon: "quote", ownerOnly: true },
      { href: "/owner/crm", label: "Customers", icon: "people", ownerOnly: true },
      { href: "/owner/bookings", adminHref: "/admin/bookings", label: "Bookings", icon: "calendar", permissions: ["bookings"] },
      { href: "/owner/quotes", adminHref: "/admin/quotes", label: "Quote requests", icon: "quote", permissions: ["quoteChats"] },
      { href: "/owner/detail-builder", label: "Build a Detail", icon: "service", permissions: ["estimateTools"] },
      { href: "/owner/estimate-calculator", label: "Estimate Calculator", icon: "clock", ownerOnly: true },
      { href: "/owner/service-guides", label: "Training Guides", icon: "book", ownerOnly: true },
      { href: "/owner/invoices", label: "Invoices", icon: "invoice", permissions: ["invoices"] },
      { href: "/owner/gift-cards", label: "Gift cards", icon: "price", ownerOnly: true },
      { href: "/owner/shop", label: "Merch shop", icon: "price", ownerOnly: true },
      { href: "/owner/loyalty", label: "Loyalty cards", icon: "shield", permissions: ["loyalty"] },
      { href: "/owner/maintenance", label: "Subscriptions & maintenance", icon: "price", permissions: ["maintenance"] },
      { href: "/owner/calls", label: "Business phone", icon: "phone", permissions: ["businessPhone"] },
    ],
  },
  {
    label: "Messages",
    icon: "message",
    items: [
      { href: "/owner/email", label: "Email", icon: "message", ownerOnly: true },
      { href: "/owner/messages", adminHref: "/admin/messages", label: "Messages", icon: "message", permissions: ["smsInbox"] },
      { href: "/owner/support", adminHref: "/admin/support", label: "Support inbox", icon: "support", permissions: ["support"] },
    ],
  },
  {
    label: "Schedule",
    icon: "calendar",
    items: [
      { href: "/owner/schedule", label: "Schedule", icon: "calendar", ownerOnly: true },
      { href: "/owner/analytics", label: "Analytics", icon: "chart", permissions: ["analytics"] },
      { href: "/owner/revenue", label: "Revenue by service", icon: "chart", ownerOnly: true },
    ],
  },
  {
    label: "Website",
    icon: "web",
    items: [
      { href: "/owner/website", label: "Content", icon: "web", permissions: ["website"] },
      { href: "/owner/pricing-pages", label: "Pricing", icon: "price", permissions: ["pricing"] },
      { href: "/owner/promotions", label: "Automatic Promotions", icon: "price", ownerOnly: true },
      { href: "/owner/promo-codes", label: "Promo Codes", icon: "price", permissions: ["pricing"] },
      { href: "/owner/services", label: "Products & services", icon: "service", permissions: ["services"] },
      { href: "/owner/gallery", label: "Photos & media", icon: "photo", permissions: ["gallery"] },
    ],
  },
  {
    label: "Operations",
    icon: "grid",
    items: [
      { href: "/owner/jobs", label: "Jobs & Quality", icon: "photo", permissions: ["assignedJobs"] },
      { href: "/owner/inspection", label: "Final inspection", icon: "shield", permissions: ["assignedJobs"] },
      { href: "/owner/booking-settings", label: "Booking settings", icon: "clock", permissions: ["pricing", "bookings"] },
      { href: "/owner/inventory", label: "Supply inventory", icon: "grid", permissions: ["inventory"] },
      { href: "/owner/service-durations", label: "Service Time Durations", icon: "clock", permissions: ["pricing"] },
      { href: "/owner/warranties", label: "Ceramic warranties", icon: "shield", permissions: ["warranties"] },
      { href: "/staff-guide", adminHref: "/admin/staff-guide", label: "Staff guide", icon: "book", permissions: ["staffGuide"] },
    ],
  },
  {
    label: "Admin",
    icon: "settings",
    items: [
      { href: "/owner/admins", label: "Employees & resources", icon: "people", ownerOnly: true },
      { href: "/owner/pay-tracking", label: "Pay tracking", icon: "price", ownerOnly: true },
      { href: "/owner/settings", adminHref: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></>,
  chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
  quote: <><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></>,
  message: <><path d="M4 5h16v12H8l-4 3V5Z"/><path d="M7.5 9h9M7.5 12h6"/></>,
  invoice: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  phone: <path d="M7 3 4 5c-.8.6-.7 2 .1 3.6 1 2.2 2.8 4.6 5 6.7 2.1 2.1 4.5 3.8 6.7 4.8 1.6.7 3 .8 3.6 0l1.6-2.5-5-3-1.7 2.1c-.3.4-.9.5-1.4.2a15 15 0 0 1-5.8-5.8c-.3-.5-.2-1.1.2-1.4L10 8 7 3Z"/>,
  web: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  price: <><path d="M12 3v18"/><path d="M17 7.2c-1.1-1.2-2.8-1.8-5-1.8-2.7 0-4.5 1.2-4.5 3.2 0 4.8 9.5 2.1 9.5 7 0 2-1.8 3.4-5 3.4-2.4 0-4.3-.8-5.5-2.2"/></>,
  service: <><path d="M4 7h10M4 17h16M14 7h6M4 12h4M12 12h8"/><circle cx="11" cy="12" r="2"/><circle cx="17" cy="7" r="2"/></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4-4 3 3 3-3 4 4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.6 2.6 8 7 10 4.4-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></>,
  book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/></>,
  people: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.4-4 2.5-6 6-6s5.6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15c3.2.2 4.8 1.9 5 5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.4 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.4-1a8 8 0 0 0 1.8 1l.4 3.1h4.8l.4-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2.1-1.5a7 7 0 0 0 .1-1Z"/></>,
  support: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 17h.01"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m16.2 16.2 4 4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  grid: <><path d="M4 6h6M4 12h10M4 18h16"/><circle cx="17" cy="6" r="2"/></>,
};

function Icon({ name, className = "h-[21px] w-[21px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function pageTitle(pathname: string, owner: boolean) {
  for (const group of groups) {
    for (const item of group.items) {
      const href = owner ? item.href : (item.adminHref || item.href);
      if (pathname === href || pathname.startsWith(`${href}/`)) return item.label;
    }
  }
  return pathname.includes("/dashboard") ? "Home" : "Workspace";
}

function NotificationBadge({count=0}:{count?:number}) {
  if(count<1)return null;
  return <span aria-label={`${count} notifications`} className="console-notification-badge inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white">{count>99?"99+":count}</span>;
}

export default function OwnerShell({ children, user, permissions = [] }: { children: ReactNode; user: OwnerUser; permissions?: string[] }) {
  const pathname = usePathname();
  const [fullWorkspace, setFullWorkspace] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [phoneViewport,setPhoneViewport] = useState(false);
  useEffect(()=>{
    const query=window.matchMedia("(max-width: 767px)");
    const refresh=()=>setPhoneViewport(query.matches);
    refresh();
    query.addEventListener("change",refresh);
    return()=>query.removeEventListener("change",refresh);
  },[]);
    const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profilePhoto,setProfilePhoto]=useState<string|null>(null);
  const [profileName,setProfileName]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const response=await fetch("/api/account-profile",{cache:"no-store"});
        if(!response.ok)return;
        const data=await response.json();
        if(active){
          setProfilePhoto(typeof data.profile?.avatar==="string"?data.profile.avatar:null);
          setProfileName(typeof data.user?.name==="string"?data.user.name:null);
        }
      }catch{}
    };
    void load();
    window.addEventListener("car-dash-profile-updated",load);
    return()=>{active=false;window.removeEventListener("car-dash-profile-updated",load);};
  },[]);
  const preview = employeePreview(user);
  const owner = user.role === "owner" && !preview;
  const [appearance, setAppearance] = useState<Appearance>(() => appearanceFor(user.id));
  const [preferenceError, setPreferenceError] = useState("");
  function choose(setting: "appearance" | "view", value: string) {
    try {
      savePreference(user.id, setting, value);
      setPreferenceError("");
      if (setting === "appearance") setAppearance(appearanceFor(user.id));
      else window.location.assign(value === "employee" ? "/admin/dashboard" : "/owner/dashboard");
    } catch {
      setPreferenceError("Allow browser storage to save your workspace preference.");
    }
  }
  const isOwnerHome = owner && pathname === "/owner/dashboard";
  const isStaffHome = !owner && pathname === "/admin/dashboard";
  const privateWorkspacePage = (owner && pathname.startsWith("/owner/") && !isOwnerHome)
    || (!owner && !isStaffHome);
  const {recording, changeRecording}=useOwnerScreenPrivacy(owner?"owner":"staff");
  const [notificationCounts,setNotificationCounts]=useState<Record<string,number>>({});
  useEffect(()=>{
    let disposed=false;
    let loading=false;
    const refresh=async()=>{
      if(document.hidden||loading)return;
      loading=true;
      try{
        const response=await fetch("/api/owner/notifications",{cache:"no-store"});
        if(response.ok){const data=await response.json();if(!disposed)setNotificationCounts(current=>({...current,...data.counts}));}
      }catch{}finally{loading=false;}
    };
    const section=pathname.endsWith("/messages")?"sms":pathname.endsWith("/quotes")?"quotes":pathname.endsWith("/support")?"support":pathname.endsWith("/calls")?"calls":null;
    void (async()=>{
      if(section)await fetch("/api/owner/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({section})}).catch(()=>undefined);
      if(!disposed)await refresh();
    })();
    const timer=setInterval(refresh,30000);
    window.addEventListener("focus",refresh);
    window.addEventListener("car-dash-notifications-refresh",refresh);
    return()=>{disposed=true;clearInterval(timer);window.removeEventListener("focus",refresh);window.removeEventListener("car-dash-notifications-refresh",refresh);};
  },[pathname]);


  const visibleGroups = useMemo(() => groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (owner) return true;
      if (item.ownerOnly) return false;
      if (!item.permissions?.length) return group.label === "Home" || item.adminHref === "/admin/settings";
      return item.permissions.some((permission) => permissions.includes(permission));
    }),
  })).filter((group) => group.items.length), [owner, permissions]);

  const allVisibleItems = useMemo(() => visibleGroups.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label, resolvedHref: owner ? item.href : (item.adminHref || item.href) }))
  ), [visibleGroups, owner]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allVisibleItems;
    return allVisibleItems.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(needle));
  }, [allVisibleItems, query]);

  const activeGroup = useMemo(() => visibleGroups.find((group) =>
    group.items.some((item) => {
      const href = owner ? item.href : (item.adminHref || item.href);
      return pathname === href || pathname.startsWith(`${href}/`);
    })
  )?.label || "Home", [visibleGroups, pathname, owner]);

  const homeHref = owner ? "/owner/dashboard" : "/admin/dashboard";
  const profileHref = owner ? "/owner/profile" : "/admin/profile";
  const quickHref = owner ? "/owner/detail-builder" : allVisibleItems.find((item) => item.label === "Bookings")?.resolvedHref || homeHref;
  const mobileQuickAction = owner ? {href:"/owner/bookings?create=1",icon:"plus" as IconName,label:"New booking"}
    : permissions.includes("bookings") ? {href:"/admin/bookings",icon:"calendar" as IconName,label:"Open bookings"}
    : permissions.includes("assignedJobs") ? {href:"/owner/jobs",icon:"photo" as IconName,label:"My jobs"}
    : permissions.includes("quoteChats") ? {href:"/admin/quotes",icon:"quote" as IconName,label:"Open quotes"}
    : null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  };

  const go = (href: string) => {
    setMobileOpen(false);
    setSearchOpen(false);
    window.location.assign(href);
  };


  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    const trigger = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>(".owner-mobile-drawer");
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('a[href],button,input,[tabindex="0"]') || []);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); trigger?.focus(); };
  }, [mobileOpen]);

  const textualNav = (
    <div className="space-y-4">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#bdb4a7]">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const href = owner ? item.href : (item.adminHref || item.href);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className={`owner-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${active ? "owner-nav-link-active bg-[#d6b779] text-[#191714]" : "text-[#d1c8bc] hover:bg-white/[.07] hover:text-white"}`}>
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <NotificationBadge count={notificationCounts[item.href]} />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if ((isOwnerHome || isStaffHome) && !fullWorkspace) {
    return <WorkboardHome owner={owner} light={appearance === "light"} permissions={permissions}
      recording={recording} onMore={() => setFullWorkspace(true)} />;
  }

  return (
    <div data-appearance={appearance} className="console-shell owner-app min-h-screen bg-[#111110] text-[#f4efe5]">
      <aside aria-label={owner ? "Owner workspace sidebar" : "Staff workspace sidebar"} className="owner-workspace-sidebar fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-white/10 bg-[#1b1b1a] text-[#f4eee5] xl:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/favicon.png" alt="Car Dash" className="h-10 w-10 rounded-xl border border-[#d6b779]/25 bg-[#25241f] p-1.5 object-contain" />
          <div className="min-w-0"><p className="truncate text-base font-semibold tracking-tight text-[#f6efe2]">Car Dash</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.20em] text-[#d6b779]">{owner ? "Owner workspace" : "Staff workspace"}</p></div>
        </div>
        <div className="px-4 pt-4">
          <button type="button" onClick={()=>{setSearchOpen(true);setQuery("");}}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-[#272622] px-3.5 py-3 text-left text-xs font-medium text-[#bdb3a7] transition hover:border-[#d6b779]/60 hover:text-white">
            <Icon name="search" className="h-4 w-4 text-[#d6b779]"/> Search workspace
            <span className="ml-auto rounded-md border border-white/10 px-1.5 py-1 text-[10px] text-[#958d80]">Find</span>
          </button>
          <a href={owner?"/owner/bookings?create=1":allVisibleItems.find(item=>item.label==="Bookings")?.resolvedHref||homeHref}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#d6b779] px-3 py-3 text-xs font-bold text-[#181715] transition hover:bg-[#ead49f]">
            <Icon name="plus" className="h-4 w-4"/> New booking
          </a>
        </div>
        <nav aria-label="Workspace sections" className="owner-sidebar-nav min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-5">
          {textualNav}
        </nav>
        <div className="space-y-2 border-t border-white/10 px-4 py-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-[#c9bdad] hover:bg-white/10"><Icon name="external" className="h-4 w-4"/> Public website</a>
          <div className="flex items-center gap-3 border-t border-white/10 pt-3">
            <a href={profileHref} aria-label="Open my profile" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d6b779]/35 bg-[#302921] text-xs font-semibold text-[#ebd3a5]">{profilePhoto?<img src={profilePhoto} alt="" className="h-full w-full object-cover"/>:(profileName||user.name||user.email||"C").slice(0,1).toUpperCase()}</a>
            <div className="min-w-0 flex-1">
              <a href={profileHref} className="block truncate text-xs font-semibold text-[#f4eee5] hover:text-[#d6b779]">{profileName || user.name || (owner?"Owner":"Staff")}</a>
              <p className="truncate text-[10px] text-[#a79f94]">{user.email}</p>
            </div>
            <button type="button" onClick={logout} title="Sign out" className="rounded-lg border border-white/10 p-2 text-[10px] text-[#ceb78e] hover:bg-white/10">Exit</button>
          </div>
        </div>
      </aside>

      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 p-4 backdrop-blur-[4px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
          <div className="mx-auto mt-[10vh] w-full max-w-xl overflow-hidden rounded-[24px] border border-white/20 bg-[#1d1c1a] text-[#f4efe5] shadow-[0_38px_120px_rgba(0,0,0,.5)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-5">
              <Icon name="search" className="h-5 w-5 text-[#bdb4a7]" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Car Dash tools…" className="h-16 min-w-0 flex-1 bg-transparent text-base text-[#f4efe5] outline-none placeholder:text-[#999084]" />
              <button onClick={() => setSearchOpen(false)} className="text-xs font-semibold text-[#d6b779]">Close</button>
            </div>
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {searchResults.map((item) => (
                <button key={item.resolvedHref} onClick={() => go(item.resolvedHref)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#f4efe5] hover:bg-white/[.06]">
                  <Icon name={item.icon} className="h-[18px] w-[18px] text-[#d6b779]" />
                  <div><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-[#bdb4a7]">{item.group}</p></div>
                </button>
              ))}
              {!searchResults.length && <p className="px-4 py-10 text-center text-sm text-[#aaa49a]">No tools found.</p>}
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="owner-mobile-menu fixed inset-0 z-[90] xl:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label="More workspace tools" className="owner-mobile-drawer relative h-full w-[310px] max-w-[88vw] overflow-y-auto overscroll-contain border-r border-white/10 bg-[#1c1c1b] px-4 pb-10 pt-5 text-[#f4efe5] shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <a href={homeHref} className="flex items-center gap-3">
                <img src="/favicon.png" alt="" className="h-9 w-9 rounded-full border border-black/[.08] bg-white p-1" />
                <div><p className="text-sm font-semibold tracking-[-.02em]">Car Dash</p><p className="text-[9px] uppercase tracking-[.16em] text-[#d6b779]">{owner ? "Owner workspace" : "Staff workspace"}</p></div>
              </a>
              <button aria-label="Close More" onClick={() => setMobileOpen(false)} className="owner-menu-close grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#292723] text-[#f4efe5]"><Icon name="close" className="h-5 w-5" /></button>
            </div>
            <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="owner-menu-search mb-5 flex w-full items-center gap-3 rounded-xl border border-white/15 bg-[#2c2a27] px-4 py-3 text-sm font-medium text-[#e1d8cc] hover:border-[#e58b4b]/50">
              <Icon name="search" className="h-4 w-4" /> Search tools
            </button>
            {textualNav}
            <div className="mt-7 border-t border-black/[.08] pt-4">
              <p className="px-2 text-xs font-semibold">{user.name || user.email}</p>
              <p className="mt-1 truncate px-2 text-[10px] text-[#aaa397]">{user.email}</p>
              <div className="mt-3 grid grid-cols-2 gap-2"><a href="/" className="rounded-xl border border-white/20 bg-[#2b2925] px-3 py-2.5 text-center text-xs font-semibold text-[#f4eee5]">Website</a><button onClick={logout} className="rounded-xl bg-[#171411] px-3 py-2.5 text-xs font-semibold text-white">Sign out</button></div>
            </div>
          </aside>
        </div>
      )}

      <div className="xl:pl-[248px]">
        <header className={"console-topbar owner-workspace-topbar sticky top-0 z-40 border-b border-white/10 bg-[#1a1a19]/95 px-3 backdrop-blur-xl sm:px-6" + " owner-mobile-dashboard-topbar"}>
            <div className="flex min-h-[66px] items-center justify-between gap-2 md:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <a href={profileHref} aria-label="My profile" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d6b779]/35 bg-[#302921]">
                  {profilePhoto?<img src={profilePhoto} alt="" className="h-full w-full object-cover"/>:<span className="text-xs font-semibold text-[#e8d0a3]">{(profileName||user.name||"C").slice(0,1).toUpperCase()}</span>}
                </a>
                <a href={homeHref} className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold tracking-tight text-[#f4ece0]">Car Dash</span>
                  <span className="block truncate text-[9px] font-semibold uppercase tracking-[.13em] text-[#d6b779]">{owner?"Owner workspace":"Staff workspace"}</span>
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={() => {setSearchOpen(true);setQuery("");}}
                  aria-label="Search workspace" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#292724] text-[#f1e4d3]">
                  <Icon name="search" className="h-5 w-5"/>
                </button>
                {mobileQuickAction && <a href={mobileQuickAction.href} aria-label={mobileQuickAction.label}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6b779] text-[#171613]">
                  <Icon name={mobileQuickAction.icon} className="h-5 w-5"/>
                </a>}
                {phoneViewport && <OwnerActivityBell privacyScope={owner?"owner":"staff"} />}
              </div>
            </div>
          <div className="hidden min-h-[68px] items-center justify-between gap-3 md:flex">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileOpen(true)}
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-[#292826] text-[#f4eee5] xl:hidden" aria-label="Open navigation">
                <Icon name="menu"/>
                {allVisibleItems.some(item=>(notificationCounts[item.href]||0)>0)&&<span aria-label="Unread items" className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#191918] bg-[#d6b779]"/>}
              </button>
              <div className="min-w-0"><p className="truncate text-[9px] font-semibold uppercase tracking-[.19em] text-[#c5af82]">Car Dash / {owner?"Owner":"Staff"}</p><h1 className="mt-1 truncate text-lg font-semibold tracking-[-.03em] text-[#f5eee3]">{pageTitle(pathname,owner)}</h1></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => {setSearchOpen(true);setQuery("");}}
                className="hidden items-center gap-2 rounded-xl border border-white/15 bg-[#282724] px-3.5 py-2.5 text-xs font-semibold text-[#d7ccc0] hover:border-[#d6b779]/60 sm:inline-flex">
                <Icon name="search" className="h-4 w-4"/> Search
              </button>
              {!phoneViewport && <OwnerActivityBell privacyScope={owner?"owner":"staff"} />}
              <a href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 bg-[#272622] px-3.5 py-2.5 text-xs font-semibold text-[#ebe0ce] hover:border-[#d6b779]/60">View site</a>
            </div>
          </div>
          <nav aria-label="Business workspace tabs" className="owner-topnav hidden max-w-full gap-1 overflow-x-auto overscroll-x-contain border-t border-white/[.065] py-2 [scrollbar-width:none] md:flex">
            {(owner ? [
              {label:"Command center",href:"/owner/workspace"},
              {label:"Calendar",href:"/owner/dashboard"},
              {label:"Jobs",href:"/owner/jobs"},
              {label:"Quotes",href:"/owner/quotes"},
              {label:"Customers",href:"/owner/crm"},
              {label:"Orders",href:"/owner/bookings"},
              {label:"Payments",href:"/owner/invoices"},
              {label:"Subscriptions",href:"/owner/maintenance"},
            ] : [
              {label:"Home",href:"/admin/dashboard"},
              {label:"Bookings",href:"/admin/bookings"},
              {label:"Quotes",href:"/admin/quotes"},
              {label:"Messages",href:"/admin/messages"},
            ].filter(item=>allVisibleItems.some(v=>v.resolvedHref===item.href))).map(tab=>{
              const active=pathname===tab.href||(tab.href!=="/owner/dashboard"&&pathname.startsWith(tab.href+"/"));
              return <a key={tab.href} href={tab.href} aria-current={active?"page":undefined}
                className={"shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold transition sm:px-4 sm:text-xs "+(active?"border border-[#d6b779]/35 bg-[#d6b779]/15 text-[#f1dab0]":"border border-transparent text-[#b4aa9d] hover:bg-white/10 hover:text-[#f3e9db]")}>{tab.label}</a>;
            })}
          </nav>
        </header>
        {privateWorkspacePage && <div className="owner-mobile-context-bar sticky top-[66px] z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#1b1b1a]/95 px-4 py-3 text-[#f4eee5] backdrop-blur-lg md:hidden">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d6b779]">Car Dash / {owner?"Owner":"Staff"}</p>
            <p className="mt-1 truncate text-sm font-semibold">{pageTitle(pathname,owner)}</p>
          </div>
          <button type="button" role="switch" aria-checked={recording} aria-label="Recording privacy mode"
            onClick={()=>changeRecording(!recording)}
            className={"shrink-0 rounded-full border px-3 py-2 text-[11px] font-semibold "+(recording?"border-[#d6b779]/50 bg-[#d6b779]/15 text-[#f0d6a5]":"border-white/20 bg-[#282723] text-[#ccc1b2]")}>
            {recording?"Recording on":"Recording off"}
          </button>
        </div>}
        {preview && <div className="flex items-center justify-between gap-3 border-b border-white/15 bg-[#282723] px-4 py-2 text-sm">
          <span>Employee view · Owner account</span>
          <button type="button" onClick={() => choose("view", "owner")} className="rounded-lg border border-white/20 px-3 py-2">Return to Owner view</button>
        </div>}
        {preferenceError && <p role="alert" className="p-3">{preferenceError}</p>}
        <main className="owner-shell-content owner-mobile-section-layout min-h-[calc(100vh-112px)]">
          {(isOwnerHome || isStaffHome) && <button type="button" className="m-4 rounded-xl border border-[#d6b779]/40 px-4 py-3" onClick={() => setFullWorkspace(false)}>Back to Workboard</button>}
          {(pathname === "/owner/settings" || pathname === "/admin/settings") && <section aria-label="Workspace preferences" className="mx-auto max-w-2xl space-y-5 px-6 py-6">
            <h2 className="text-xl font-semibold">Workspace preferences</h2>
            <fieldset><legend className="mb-2 font-semibold">Appearance</legend>
              {(["light", "dark"] as const).map(mode => <label key={mode} className="mr-5 inline-flex min-h-11 items-center gap-2">
                <input type="radio" name="appearance" checked={appearance === mode} onChange={() => choose("appearance", mode)} />
                {mode === "light" ? "Light mode" : "Dark mode"}
              </label>)}
            </fieldset>
            {user.role === "owner" && <fieldset><legend className="mb-2 font-semibold">Workspace view</legend>
              {(["owner", "employee"] as const).map(view => <label key={view} className="mr-5 inline-flex min-h-11 items-center gap-2">
                <input type="radio" name="workspace-view" checked={view === (preview ? "employee" : "owner")} onChange={() => choose("view", view)} />
                {view === "owner" ? "Owner view" : "Employee view"}
              </label>)}
            </fieldset>}
          </section>}
          {privateWorkspacePage && recording ? <>
            <div className="owner-mobile-privacy-gate px-4 py-8 md:hidden">
              <div className="mx-auto max-w-lg rounded-2xl border border-[#d6b779]/25 bg-[#211f1b] p-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#d6b779]/30 bg-[#d6b779]/10 text-xl text-[#d6b779]" aria-hidden="true">•••</div>
                <h2 className="mt-4 text-lg font-semibold text-[#f4ece1]">Customer details are hidden</h2>
                <p className="mt-3 text-sm leading-6 text-[#b9afa2]">Recording mode keeps this section out of your screen recording. You can still use the navigation below.</p>
                <button type="button" onClick={()=>changeRecording(false)}
                  className="mt-5 w-full rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-bold text-[#171613]">Turn off Recording mode to view</button>
              </div>
            </div>
            <div className="hidden md:block">{children}</div>
          </> : children}
        </main>
        {owner ? <OwnerMobileBottomNav onOpenMenu={()=>setMobileOpen(true)} menuOpen={mobileOpen} /> : <StaffMobileBottomNav permissions={permissions} onOpenMenu={()=>setMobileOpen(true)} menuOpen={mobileOpen} />}
      </div>
    </div>
  );
}
