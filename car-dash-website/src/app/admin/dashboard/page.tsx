"use client";

import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; role: string };

type Card = {
  permission: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: number;
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [smsUnread, setSmsUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const data = await response.json();
      if (data.user.role === "owner") return window.location.assign("/owner/dashboard");
      if (!data.staffAccess) return window.location.assign("/dashboard");
      setUser(data.user);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    })();
  }, []);

  useEffect(() => {
    if (!user || !permissions.includes("smsInbox")) return;
    const loadUnread = () => {
      fetch("/api/sms/inbox", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => setSmsUnread(Number(payload?.totalUnread || 0)))
        .catch(() => setSmsUnread(0));
    };
    loadUnread();
    const timer = window.setInterval(loadUnread, 10000);
    return () => window.clearInterval(timer);
  }, [user, permissions]);

  const cards = useMemo<Card[]>(() => [
    { permission: "staffGuide", href: "/staff-guide", icon: "◎", title: "Staff Guide", description: "Rules, customer-service scripts, professionalism standards, and communication playbooks." },
    { permission: "bookings", href: "/admin/bookings", icon: "📅", title: "Bookings", description: "Manage booking requests, booking chat, status changes, and arrival updates." },
    { permission: "smsInbox", href: "/admin/messages", icon: "✉️", title: "SMS Inbox", description: "See customer text replies and reply from their booking conversations.", badge: smsUnread },
    { permission: "quoteChats", href: "/admin/quotes", icon: "💬", title: "Quote Chats", description: "Review photos, talk with customers, and send exact quotes." },
    { permission: "support", href: "/admin/support", icon: "↗", title: "Support", description: "Handle customer support conversations and update ticket status." },
    { permission: "businessPhone", href: "/owner/calls", icon: "☎", title: "Business Phone", description: "Review calls and voicemail, and manage blocked callers." },
    { permission: "warranties", href: "/owner/warranties", icon: "🛡️", title: "Ceramic Warranties", description: "Create and manage coating warranty records." },
    { permission: "analytics", href: "/owner/analytics", icon: "↗", title: "Analytics", description: "View bookings, customers, quote activity, and booked value." },
    { permission: "services", href: "/owner/services", icon: "⚙️", title: "Services", description: "Edit public services, descriptions, pricing, and availability." },
    { permission: "gallery", href: "/owner/gallery", icon: "🖼️", title: "Photos & Media", description: "Manage website photos and placement labels." },
    { permission: "website", href: "/owner/website", icon: "✦", title: "Website Editor", description: "Edit public website copy and homepage content." },
    { permission: "pricing", href: "/owner/pricing-pages", icon: "$", title: "Pricing Pages", description: "Manage package and fixed-price service pages." },
    { permission: "pricing", href: "/owner/booking-settings", icon: "%", title: "Add-Ons & Discounts", description: "Manage booking add-ons, discount codes, limits, and expiration dates." },
  ], [smsUnread]);

  if (!user) return <div className="min-h-screen bg-[#050505] p-12 text-white">Loading staff dashboard…</div>;

  const visible = cards.filter((card) => permissions.includes(card.permission));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">Staff</p>
            <h1 className="mt-2 text-4xl font-semibold">Staff Dashboard</h1>
            <p className="mt-2 text-sm text-white/45">Signed in as {user.email}. The panels below reflect the access the owner has assigned to this account.</p>
          </div>
          <a href="/account" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white">Account</a>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {visible.map((card) => (
            <a key={card.href} href={card.href} className="relative rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#FF2D2D]/45">
              {(card.badge || 0) > 0 && (
                <span className="absolute right-5 top-5 rounded-full bg-[#FF2D2D] px-2.5 py-1 text-xs font-bold text-[#0D0D0D]">{card.badge}</span>
              )}
              <p className="text-3xl">{card.icon}</p>
              <h2 className="mt-5 text-2xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/40">{card.description}</p>
            </a>
          ))}
        </div>

        {!visible.length && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 p-8 text-sm text-white/40">
            This account does not currently have access to any staff panels. Ask the owner to assign a role or dashboard permission.
          </div>
        )}
      </div>
    </main>
  );
}
