"use client";

import type { ReactNode } from "react";

/*
 * Glass tool grid for the owner + staff home screens, styled after the
 * "Online Booking / Quotes & Estimates / Invoices…" feature board.
 * Every tile links to the real workspace page that handles it.
 */

type GlyphName =
  | "booking" | "quote" | "invoice" | "card" | "deposit" | "sync" | "bell" | "camera"
  | "megaphone" | "car" | "star" | "tip" | "wallet" | "chat" | "timer" | "people"
  | "repeat" | "earnings" | "gift" | "loyalty" | "team" | "website" | "box" | "phone" | "shield";

type Feature = {
  label: string;
  detail: string;
  href: string;
  adminHref?: string;
  glyph: GlyphName;
  permissions?: string[];
  ownerOnly?: boolean;
};

export const FEATURES: Feature[] = [
  { label: "Online Booking", detail: "Requests, confirmations & the calendar", href: "/owner/bookings", adminHref: "/admin/bookings", glyph: "booking", permissions: ["bookings"] },
  { label: "Quotes & Estimates", detail: "Reply to quote chats and price jobs", href: "/owner/quotes", adminHref: "/admin/quotes", glyph: "quote", permissions: ["quoteChats"] },
  { label: "Invoices", detail: "Send, track and collect balances", href: "/owner/invoices", glyph: "invoice", permissions: ["invoices"] },
  { label: "Card Payments", detail: "Online card checkout on every invoice", href: "/owner/invoices", glyph: "card", permissions: ["invoices"] },
  { label: "Deposits", detail: "Booking rules, holds and deposits", href: "/owner/booking-settings", glyph: "deposit", permissions: ["pricing", "bookings"] },
  { label: "Calendar Sync", detail: "Planner + subscribe from your phone", href: "/owner/schedule", glyph: "sync", ownerOnly: true },
  { label: "Reminders", detail: "Appointment reminder texts", href: "/owner/bookings", adminHref: "/admin/bookings", glyph: "bell", permissions: ["bookings"] },
  { label: "Before & After Photos", detail: "Job photos and the public gallery", href: "/owner/gallery", glyph: "camera", permissions: ["gallery"] },
  { label: "Marketing Studio", detail: "Automatic promotions and campaigns", href: "/owner/promotions", glyph: "megaphone", ownerOnly: true },
  { label: "Price per Vehicle", detail: "Sedan, SUV, truck and add-on pricing", href: "/owner/pricing-pages", glyph: "car", permissions: ["pricing"] },
  { label: "Reviews", detail: "Customer reviews shown on your site", href: "/owner/website", glyph: "star", permissions: ["website"] },
  { label: "Tips", detail: "Tips collected with invoice payments", href: "/owner/invoices", glyph: "tip", permissions: ["invoices"] },
  { label: "Other Ways to Pay", detail: "Cash, Zelle, Venmo & Cash App", href: "/owner/invoices", glyph: "wallet", permissions: ["invoices"] },
  { label: "“On My Way” Texts", detail: "Text customers from the inbox", href: "/owner/messages", adminHref: "/admin/messages", glyph: "chat", permissions: ["smsInbox"] },
  { label: "Job Timer", detail: "Track job progress and quality", href: "/owner/jobs", glyph: "timer", permissions: ["assignedJobs"] },
  { label: "Customer List", detail: "Vehicles, history and notes", href: "/owner/crm", glyph: "people", ownerOnly: true },
  { label: "Rebooking", detail: "Maintenance plans and repeat visits", href: "/owner/maintenance", glyph: "repeat", permissions: ["maintenance"] },
  { label: "Earnings", detail: "Revenue by service and trends", href: "/owner/revenue", glyph: "earnings", ownerOnly: true },
  { label: "Gift Cards", detail: "Sales and redemptions", href: "/owner/gift-cards", glyph: "gift", ownerOnly: true },
  { label: "Loyalty Cards", detail: "Repeat-customer rewards", href: "/owner/loyalty", glyph: "loyalty", permissions: ["loyalty"] },
  { label: "Supply Inventory", detail: "Products and reorder levels", href: "/owner/inventory", glyph: "box", permissions: ["inventory", "assignedJobs"] },
  { label: "Business Phone", detail: "Calls and voicemail", href: "/owner/calls", glyph: "phone", permissions: ["businessPhone"] },
  { label: "Team & Access", detail: "Employees, teams and permissions", href: "/owner/admins", glyph: "team", ownerOnly: true },
  { label: "Add to Your Website", detail: "Edit pages, content and services", href: "/owner/website", glyph: "website", permissions: ["website"] },
];

const glyphs: Record<GlyphName, ReactNode> = {
  booking: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M12 13v4M10 15h4"/></>,
  quote: <><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></>,
  invoice: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></>,
  deposit: <><path d="M5 12c0-4 3.5-6 7-6 3 0 5 1 6 3h2v4l-2 1c-.5 1.5-1.5 2.5-3 3v2h-3v-1.5h-2V19H7v-2.5C5.8 15.5 5 14 5 12Z"/><circle cx="15" cy="10.5" r=".6"/></>,
  sync: <><path d="M4 11a8 8 0 0 1 14-4l2 2M20 13a8 8 0 0 1-14 4l-2-2"/><path d="M20 5v4h-4M4 19v-4h4"/></>,
  bell: <><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7"/><path d="M10 20a2 2 0 0 0 4 0M4 4l2 2M20 4l-2 2"/></>,
  camera: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/></>,
  megaphone: <><path d="M4 10v4l12 5V5L4 10Z"/><path d="M8 15.5V19a1 1 0 0 0 1 1h1.5M19 9.5a3 3 0 0 1 0 5"/></>,
  car: <><path d="M3 15v-3l2-5h14l2 5v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M3 12h18"/><circle cx="7.5" cy="16" r="1.8"/><circle cx="16.5" cy="16" r="1.8"/></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>,
  tip: <><path d="M3 14h3l4 2h4a1.5 1.5 0 0 0 0-3h-3M6 20h7l7-4a1.5 1.5 0 0 0-1.5-2.5L14 15"/><circle cx="15" cy="7" r="3"/><path d="M15 6v2"/></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14h2"/></>,
  chat: <><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8 10h8M8 13h5"/></>,
  timer: <><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 2.5h4M12 2.5v3"/></>,
  people: <><circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5M14.5 15.2c2.8-.4 5 1 5.5 3.8"/></>,
  repeat: <><path d="M4 9h13l-3-3M20 15H7l3 3"/></>,
  earnings: <><path d="M4 4v16h16"/><path d="m7 15 4-4 3 3 5-6"/></>,
  gift: <><rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 13h18M12 9v11M12 9H8a2.5 2.5 0 1 1 2.5-3.5L12 9l1.5-3.5A2.5 2.5 0 1 1 16 9h-4"/></>,
  loyalty: <><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="16" cy="12" r="1.3"/></>,
  team: <><circle cx="12" cy="8" r="3"/><path d="M6 20c.4-3.6 2.6-6 6-6s5.6 2.4 6 6"/></>,
  website: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></>,
  box: <><path d="m12 3 8 4v10l-8 4-8-4V7z"/><path d="m4 7 8 4 8-4M12 11v10"/></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.6 2.6 8 7 10 4.4-2 7-5.4 7-10V6z"/></>,
};

export function FeatureGlyph({ name, className = "h-[18px] w-[18px]" }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {glyphs[name]}
    </svg>
  );
}

export function visibleFeatures(owner: boolean, permissions: string[]) {
  const seen = new Set<string>();
  return FEATURES.filter((feature) => {
    if (!owner) {
      if (feature.ownerOnly) return false;
      if (!feature.permissions?.some((key) => permissions.includes(key))) return false;
    }
    if (seen.has(feature.label)) return false;
    seen.add(feature.label);
    return true;
  }).map((feature) => ({ ...feature, resolvedHref: owner ? feature.href : (feature.adminHref || feature.href) }));
}

export default function FeatureGrid({ owner, permissions = [], title, eyebrow }: { owner: boolean; permissions?: string[]; title?: string; eyebrow?: string }) {
  const features = visibleFeatures(owner, permissions);
  if (!features.length) return null;
  return (
    <section className="cd-feature-board" aria-label="Workspace tools">
      <div className="cd-feature-head">
        <p className="cd-mono-cap">{eyebrow || (owner ? "Tools" : "Your tools")}</p>
        <h2>{title || "Everything you need, one tap away"}</h2>
      </div>
      <div className="cd-feature-grid">
        {features.map((feature) => (
          <a key={feature.label} href={feature.resolvedHref} className="cd-feature-tile" title={feature.detail}>
            <span className="cd-feature-chip"><FeatureGlyph name={feature.glyph} /></span>
            <span className="cd-feature-text">
              <strong>{feature.label}</strong>
              <small>{feature.detail}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
