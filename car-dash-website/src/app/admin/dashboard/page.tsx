"use client";

import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; role: string };

type Tool = {
  permission: string;
  href: string;
  title: string;
  description: string;
  kind: string;
  badge?: number;
};

function Glyph({ kind }: { kind: string }) {
  const cls = "h-[19px] w-[19px]";
  if (kind === "booking") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
  if (kind === "message") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M4 5h16v12H8l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
  if (kind === "quote") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M8 9h8M8 12h7"/></svg>;
  if (kind === "support") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 17h.01"/></svg>;
  if (kind === "phone") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M7 3 4 5c-.8.6-.7 2 .1 3.6 1 2.2 2.8 4.6 5 6.7 2.1 2.1 4.5 3.8 6.7 4.8 1.6.7 3 .8 3.6 0l1.6-2.5-5-3-1.7 2.1c-.3.4-.9.5-1.4.2a15 15 0 0 1-5.8-5.8c-.3-.5-.2-1.1.2-1.4L10 8 7 3Z"/></svg>;
  if (kind === "web") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>;
  if (kind === "photo") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4-4 3 3 3-3 4 4"/></svg>;
  if (kind === "analytics") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>;
  if (kind === "guide") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls}><path d="M4 7h10M4 17h16M14 7h6M4 12h4M12 12h8"/><circle cx="11" cy="12" r="2"/><circle cx="17" cy="7" r="2"/></svg>;
}

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

  const tools = useMemo<Tool[]>(() => [
    { permission: "bookings", href: "/admin/bookings", title: "Bookings", description: "Appointments, status changes and arrival updates", kind: "booking" },
    { permission: "smsInbox", href: "/admin/messages", title: "Messages", description: "Customer SMS conversations", kind: "message", badge: smsUnread },
    { permission: "quoteChats", href: "/admin/quotes", title: "Quote requests", description: "Photos, conversations and exact quotes", kind: "quote" },
    { permission: "support", href: "/admin/support", title: "Support inbox", description: "Customer support conversations", kind: "support" },
    { permission: "businessPhone", href: "/owner/calls", title: "Business phone", description: "Calls, voicemail and blocked callers", kind: "phone" },
    { permission: "warranties", href: "/owner/warranties", title: "Ceramic warranties", description: "Create and manage coating warranty records", kind: "detail" },
    { permission: "analytics", href: "/owner/analytics", title: "Analytics", description: "Bookings, customers and booked value", kind: "analytics" },
    { permission: "services", href: "/owner/services", title: "Services", description: "Public services and availability", kind: "detail" },
    { permission: "gallery", href: "/owner/gallery", title: "Photos & media", description: "Website galleries and placement", kind: "photo" },
    { permission: "website", href: "/owner/website", title: "Website content", description: "Homepage and public website copy", kind: "web" },
    { permission: "pricing", href: "/owner/pricing-pages", title: "Pricing", description: "Packages and fixed-price services", kind: "detail" },
    { permission: "pricing", href: "/owner/booking-settings", title: "Booking settings", description: "Add-ons, discounts and availability", kind: "detail" },
    { permission: "staffGuide", href: "/staff-guide", title: "Staff guide", description: "Scripts, standards and playbooks", kind: "guide" },
  ], [smsUnread]);

  const visible = tools.filter((tool) => permissions.includes(tool.permission));

  if (!user) {
    return <div className="grid min-h-[60vh] place-items-center text-sm text-black/35">Loading staff workspace…</div>;
  }

  const attention = visible.filter((tool) => (tool.badge || 0) > 0);

  return (
    <main className="console-home px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1080px]">
        <section className="pb-8 pt-2">
          <p className="text-[11px] font-medium text-black/32">Home</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
            Hey {user.name?.split(" ")[0] || "there"}.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/42">
            Your Car Dash workspace only shows the tools the Owner has given you access to.
          </p>
        </section>

        <section className="border-t border-black/[.08] pt-6">
          <p className="mb-3 text-[13px] font-medium text-black/38">Last few minutes</p>
          <div className="overflow-hidden rounded-[18px] border border-black/[.075] bg-[#f8f6f0]">
            {attention.length ? (
              attention.map((tool) => (
                <a key={tool.href} href={tool.href} className="group grid gap-3 px-4 py-4 hover:bg-white/72 sm:grid-cols-[42px_1fr_auto] sm:items-center sm:px-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-black/[.07] bg-white text-black/58"><Glyph kind={tool.kind} /></span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-black/28">{tool.title}</p>
                    <p className="mt-1 text-sm font-medium">{tool.badge} unread customer message{tool.badge === 1 ? "" : "s"}</p>
                  </div>
                  <span className="text-xs text-black/30 group-hover:text-black/55">Open →</span>
                </a>
              ))
            ) : (
              <div className="px-5 py-9">
                <p className="text-sm font-medium text-black/48">You’re caught up.</p>
                <p className="mt-1 text-xs text-black/28">New customer activity will show here.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-9 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium text-black/38">Your tools</p>
            <a href="/account" className="text-xs font-medium text-black/30 hover:text-black">Account →</a>
          </div>

          {visible.length ? (
            <div className="overflow-hidden rounded-[18px] border border-black/[.075] bg-[#f8f6f0]">
              <div className="divide-y divide-black/[.065]">
                {visible.map((tool) => (
                  <a key={tool.href} href={tool.href} className="group grid gap-3 px-4 py-4 transition hover:bg-white/72 sm:grid-cols-[42px_1fr_auto] sm:items-center sm:px-5">
                    <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-black/[.07] bg-white text-black/58">
                      <Glyph kind={tool.kind} />
                      {(tool.badge || 0) > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#171411] px-1 text-[9px] font-bold text-white">{tool.badge}</span>}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{tool.title}</p>
                      <p className="mt-1 truncate text-xs text-black/34">{tool.description}</p>
                    </div>
                    <span className="text-lg text-black/18 transition group-hover:text-black/52">↗</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-black/10 bg-white/45 p-8 text-sm text-black/38">
              This account doesn’t have any staff tools assigned yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
