"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type OwnerUser = { name?: string | null; email?: string | null; role?: string | null };

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
    items: [{ href: "/owner/dashboard", adminHref: "/admin/dashboard", label: "Home", icon: "home" }],
  },
  {
    label: "Customers",
    icon: "people",
    items: [
      { href: "/owner/bookings", adminHref: "/admin/bookings", label: "Bookings", icon: "calendar", permissions: ["bookings"] },
      { href: "/owner/quotes", adminHref: "/admin/quotes", label: "Quote requests", icon: "quote", permissions: ["quoteChats"] },
      { href: "/owner/detail-builder", label: "Build a Detail", icon: "service", ownerOnly: true },
      { href: "/owner/invoices", label: "Invoices", icon: "invoice", ownerOnly: true },
      { href: "/owner/maintenance", label: "Maintenance", icon: "price", ownerOnly: true },
      { href: "/owner/calls", label: "Business phone", icon: "phone", permissions: ["businessPhone"] },
    ],
  },
  {
    label: "Messages",
    icon: "message",
    items: [
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
    ],
  },
  {
    label: "Website",
    icon: "web",
    items: [
      { href: "/owner/website", label: "Content", icon: "web", permissions: ["website"] },
      { href: "/owner/pricing-pages", label: "Pricing", icon: "price", permissions: ["pricing"] },
      { href: "/owner/promotions", label: "Promotions", icon: "price", ownerOnly: true },
      { href: "/owner/services", label: "Services", icon: "service", permissions: ["services"] },
      { href: "/owner/gallery", label: "Photos & media", icon: "photo", permissions: ["gallery"] },
    ],
  },
  {
    label: "Operations",
    icon: "grid",
    items: [
      { href: "/owner/booking-settings", label: "Booking settings", icon: "clock", permissions: ["pricing", "bookings"] },
      { href: "/owner/warranties", label: "Ceramic warranties", icon: "shield", permissions: ["warranties"] },
      { href: "/staff-guide", label: "Staff guide", icon: "book", permissions: ["staffGuide"] },
    ],
  },
  {
    label: "Admin",
    icon: "settings",
    items: [
      { href: "/owner/admins", label: "Staff & accounts", icon: "people", ownerOnly: true },
      { href: "/owner/settings", label: "Settings", icon: "settings", ownerOnly: true },
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

export default function OwnerShell({ children, user, permissions = [] }: { children: ReactNode; user: OwnerUser; permissions?: string[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const owner = user.role === "owner";

  const visibleGroups = useMemo(() => groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (owner) return true;
      if (item.ownerOnly) return false;
      if (!item.permissions?.length) return group.label === "Home";
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
  const quickHref = owner ? "/owner/detail-builder" : allVisibleItems.find((item) => item.label === "Bookings")?.resolvedHref || homeHref;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  };

  const go = (href: string) => {
    setPanel(null);
    setMobileOpen(false);
    setSearchOpen(false);
    window.location.assign(href);
  };

  const panelGroup = visibleGroups.find((group) => group.label === panel);

  const textualNav = (
    <div className="space-y-5">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-black/32">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const href = owner ? item.href : (item.adminHref || item.href);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${active ? "bg-[#171411] text-white" : "text-black/56 hover:bg-black/[.045] hover:text-black"}`}>
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="console-shell min-h-screen bg-[#f3f0e8] text-[#171411]">
      <aside className="console-rail fixed inset-y-0 left-0 z-50 hidden w-[76px] border-r border-black/[.08] bg-[#f8f6f0]/95 backdrop-blur-xl lg:flex lg:flex-col lg:items-center">
        <div className="flex w-full flex-col items-center gap-2 px-2 pt-4">
          <button title="Quick create" onClick={() => go(quickHref)} className="grid h-12 w-12 place-items-center rounded-full bg-[#0d0d0d] text-white shadow-[0_12px_28px_rgba(23,20,17,.15)] transition hover:scale-[1.04]">
            <Icon name="plus" className="h-6 w-6" />
          </button>
          <button title="Search tools" onClick={() => { setSearchOpen(true); setQuery(""); }} className="console-rail-button mt-2">
            <Icon name="search" />
          </button>
        </div>

        <nav className="mt-4 flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-2 pb-3">
          {visibleGroups.map((group) => {
            const isHome = group.label === "Home";
            const active = activeGroup === group.label;
            const target = owner ? group.items[0].href : (group.items[0].adminHref || group.items[0].href);
            return (
              <button
                key={group.label}
                title={group.label}
                onClick={() => isHome ? go(target) : setPanel(panel === group.label ? null : group.label)}
                className={`console-rail-button relative ${active ? "console-rail-button-active" : ""}`}
              >
                <Icon name={group.icon} />
                {active && <span className="absolute -left-2 h-7 w-[3px] rounded-r-full bg-[#171411]" />}
              </button>
            );
          })}
        </nav>

        <div className="flex w-full flex-col items-center gap-2 border-t border-black/[.07] px-2 py-3">
          <a title="View website" href="/" target="_blank" rel="noreferrer" className="console-rail-button"><Icon name="external" /></a>
          <button title={user.name || user.email || "Account"} onClick={() => setPanel(panel === "Account" ? null : "Account")} className="grid h-10 w-10 place-items-center rounded-full bg-[#171411] text-xs font-semibold text-white">
            {(user.name || user.email || "C").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </aside>

      {panelGroup && (
        <div className="console-flyout fixed left-[86px] top-4 z-[60] hidden w-[286px] overflow-hidden rounded-[22px] border border-black/[.09] bg-[#fbfaf6]/98 shadow-[0_30px_90px_rgba(23,20,17,.16)] backdrop-blur-2xl lg:block">
          <div className="border-b border-black/[.07] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/30">Car Dash</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">{panelGroup.label}</h2>
          </div>
          <div className="p-2">
            {panelGroup.items.map((item) => {
              const href = owner ? item.href : (item.adminHref || item.href);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <a key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${active ? "bg-[#171411] text-white" : "text-black/62 hover:bg-black/[.04] hover:text-black"}`}>
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  <span className="font-medium">{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {panel === "Account" && (
        <div className="console-flyout fixed bottom-4 left-[86px] z-[60] hidden w-[300px] rounded-[22px] border border-black/[.09] bg-[#fbfaf6]/98 p-4 shadow-[0_30px_90px_rgba(23,20,17,.16)] backdrop-blur-2xl lg:block">
          <p className="text-sm font-semibold">{user.name || (owner ? "Car Dash Owner" : "Car Dash Staff")}</p>
          <p className="mt-1 truncate text-xs text-black/38">{user.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="/account" className="rounded-xl border border-black/[.08] bg-white px-3 py-2.5 text-center text-xs font-semibold text-black/56">Account</a>
            <button onClick={logout} className="rounded-xl bg-[#171411] px-3 py-2.5 text-xs font-semibold text-white">Sign out</button>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/20 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
          <div className="mx-auto mt-[10vh] w-full max-w-xl overflow-hidden rounded-[24px] border border-black/[.1] bg-[#fbfaf6] shadow-[0_38px_120px_rgba(23,20,17,.22)]">
            <div className="flex items-center gap-3 border-b border-black/[.08] px-5">
              <Icon name="search" className="h-5 w-5 text-black/35" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Car Dash tools…" className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-black/28" />
              <button onClick={() => setSearchOpen(false)} className="text-xs font-semibold text-black/35">ESC</button>
            </div>
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {searchResults.map((item) => (
                <button key={item.resolvedHref} onClick={() => go(item.resolvedHref)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-black/[.045]">
                  <Icon name={item.icon} className="h-[18px] w-[18px] text-black/48" />
                  <div><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-black/28">{item.group}</p></div>
                </button>
              ))}
              {!searchResults.length && <p className="px-4 py-10 text-center text-sm text-black/35">No tools found.</p>}
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[310px] max-w-[88vw] overflow-y-auto bg-[#f8f6f0] px-4 pb-8 pt-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <a href={homeHref} className="flex items-center gap-3">
                <img src="/favicon.png" alt="" className="h-9 w-9 rounded-full border border-black/[.08] bg-white p-1" />
                <div><p className="text-sm font-semibold tracking-[-.02em]">Car Dash</p><p className="text-[9px] uppercase tracking-[.16em] text-black/32">{owner ? "Owner workspace" : "Staff workspace"}</p></div>
              </a>
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-black/[.09] bg-white"><Icon name="close" className="h-5 w-5" /></button>
            </div>
            <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="mb-5 flex w-full items-center gap-3 rounded-xl border border-black/[.08] bg-white px-4 py-3 text-sm text-black/42">
              <Icon name="search" className="h-4 w-4" /> Search tools
            </button>
            {textualNav}
            <div className="mt-7 border-t border-black/[.08] pt-4">
              <p className="px-2 text-xs font-semibold">{user.name || user.email}</p>
              <p className="mt-1 truncate px-2 text-[10px] text-black/32">{user.email}</p>
              <div className="mt-3 grid grid-cols-2 gap-2"><a href="/" className="rounded-xl border border-black/[.08] bg-white px-3 py-2.5 text-center text-xs font-semibold">Website</a><button onClick={logout} className="rounded-xl bg-[#171411] px-3 py-2.5 text-xs font-semibold text-white">Sign out</button></div>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[76px]">
        <header className="console-topbar sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-black/[.07] bg-[#f8f6f0]/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-black/[.09] bg-white lg:hidden" aria-label="Open navigation"><Icon name="menu" /></button>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[.17em] text-black/28">Car Dash / {owner ? "Owner" : "Staff"}</p>
              <h1 className="mt-0.5 text-[17px] font-semibold tracking-[-.025em]">{pageTitle(pathname, owner)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setSearchOpen(true); setQuery(""); }} className="hidden rounded-full border border-black/[.08] bg-white px-3.5 py-2 text-xs font-medium text-black/45 hover:text-black sm:inline-flex">⌘ Search</button>
            <a href="/" target="_blank" rel="noreferrer" className="rounded-full border border-black/[.08] bg-white px-3.5 py-2 text-xs font-medium text-black/48 hover:text-black">View site</a>
          </div>
        </header>
        <main className="owner-shell-content min-h-[calc(100vh-72px)]">{children}</main>
      </div>
    </div>
  );
}
