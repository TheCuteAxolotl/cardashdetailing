"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type OwnerUser = { name?: string | null; email?: string | null; role?: string | null };

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permissions?: string[];
  ownerOnly?: boolean;
};

type IconName =
  | "home"
  | "chart"
  | "calendar"
  | "quote"
  | "message"
  | "invoice"
  | "phone"
  | "web"
  | "price"
  | "service"
  | "photo"
  | "clock"
  | "shield"
  | "book"
  | "people"
  | "settings"
  | "support"
  | "external"
  | "menu"
  | "close";

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { href: "/owner/dashboard", label: "Dashboard", icon: "home" },
      { href: "/owner/schedule", label: "Schedule", icon: "calendar", ownerOnly: true },
      { href: "/owner/analytics", label: "Analytics", icon: "chart", permissions: ["analytics"] },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/owner/bookings", label: "Bookings", icon: "calendar", ownerOnly: true },
      { href: "/owner/quotes", label: "Quote requests", icon: "quote", ownerOnly: true },
      { href: "/owner/detail-builder", label: "Build a Detail", icon: "service", ownerOnly: true },
      { href: "/owner/messages", label: "Messages", icon: "message", ownerOnly: true },
      { href: "/owner/invoices", label: "Invoices", icon: "invoice", ownerOnly: true },
      { href: "/owner/calls", label: "Business phone", icon: "phone", permissions: ["businessPhone"] },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/owner/website", label: "Content", icon: "web", permissions: ["website"] },
      { href: "/owner/pricing-pages", label: "Pricing", icon: "price", permissions: ["pricing"] },
      { href: "/owner/services", label: "Services", icon: "service", permissions: ["services"] },
      { href: "/owner/gallery", label: "Photos & media", icon: "photo", permissions: ["gallery"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/owner/booking-settings", label: "Booking settings", icon: "clock", permissions: ["pricing", "bookings"] },
      { href: "/owner/warranties", label: "Ceramic warranties", icon: "shield", permissions: ["warranties"] },
      { href: "/staff-guide", label: "Staff guide", icon: "book" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/owner/admins", label: "Staff & accounts", icon: "people", ownerOnly: true },
      { href: "/owner/support", label: "Support inbox", icon: "support", ownerOnly: true },
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
};

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function pageTitle(pathname: string) {
  for (const group of groups) {
    const item = group.items.find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
    if (item) return item.label;
  }
  return "Owner";
}

export default function OwnerShell({ children, user, permissions = [] }: { children: ReactNode; user: OwnerUser; permissions?: string[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const owner = user.role === "owner";

  const visibleGroups = useMemo(() => groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (owner) return true;
      if (item.ownerOnly) return false;
      if (!item.permissions?.length) return true;
      return item.permissions.some((permission) => permissions.includes(permission));
    }),
  })).filter((group) => group.items.length), [owner, permissions]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0c0c0c] text-white">
      <div className="border-b border-white/[.08] px-5 py-5">
        <a href="/owner/dashboard" className="flex items-center gap-3">
          <img src="/favicon.png" alt="Car Dash" className="h-9 w-[72px] object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-.02em]">Car Dash</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[.16em] text-white/35">Business console</p>
          </div>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-white/28">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${active ? "bg-white text-[#111]" : "text-white/58 hover:bg-white/[.06] hover:text-white"}`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[.08] p-3">
        <a href="/" target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/52 hover:bg-white/[.06] hover:text-white">
          <Icon name="external" />
          View website
        </a>
        <div className="flex items-center gap-3 rounded-lg px-3 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[.09] text-xs font-semibold text-white/75">
            {(user.name || user.email || "C").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/78">{user.name || "Car Dash Owner"}</p>
            <p className="truncate text-[10px] text-white/32">{user.email}</p>
          </div>
          <button onClick={logout} className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/35 hover:text-white">Out</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f2f0] text-[#151515]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-black/10 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/55" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[290px] max-w-[86vw] shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/[.08] bg-[#f8f8f6]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-md border border-black/10 bg-white lg:hidden" aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/35">Car Dash / Owner</p>
              <h1 className="mt-0.5 text-base font-semibold tracking-[-.02em]">{pageTitle(pathname)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="hidden rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/60 hover:border-black/20 hover:text-black sm:inline-flex">View site</a>
            <button onClick={logout} className="rounded-md bg-[#111] px-3 py-2 text-xs font-semibold text-white hover:bg-black">Sign out</button>
          </div>
        </header>
        <main className="owner-shell-content min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
