"use client";

import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role: string };

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [smsUnread, setSmsUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const data = await response.json();
      if (data.user.role === "owner") return window.location.assign("/owner/dashboard");
      if (data.user.role !== "admin") return window.location.assign("/");
      setUser(data.user);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadUnread = () => {
      fetch("/api/sms/inbox", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => setSmsUnread(Number(payload?.totalUnread || 0)))
        .catch(() => setSmsUnread(0));
    };

    loadUnread();
    const timer = window.setInterval(loadUnread, 10000);
    return () => window.clearInterval(timer);
  }, [user]);

  if (!user) return <div className="min-h-screen bg-[#050505] p-12 text-white">Loading staff dashboard…</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">Staff</p>
        <h1 className="mt-2 text-4xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-white/45">Signed in as {user.email}. This account has access to bookings, support, and customer quote chats.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <a href="/admin/bookings" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#FF2D2D]/45">
            <p className="text-3xl">📅</p>
            <h2 className="mt-5 text-2xl font-semibold">Bookings</h2>
            <p className="mt-2 text-sm text-white/40">View customer booking requests and update their status.</p>
          </a>
          <a href="/admin/messages" className="relative rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#FF2D2D]/45">
            {smsUnread > 0 && (
              <span className="absolute right-5 top-5 rounded-full bg-[#FF2D2D] px-2.5 py-1 text-xs font-bold text-[#0D0D0D]">{smsUnread}</span>
            )}
            <p className="text-3xl">✉️</p>
            <h2 className="mt-5 text-2xl font-semibold">SMS Inbox</h2>
            <p className="mt-2 text-sm text-white/40">See customer text replies and reply from their booking conversation.</p>
          </a>
          <a href="/admin/quotes" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#FF2D2D]/45">
            <p className="text-3xl">💬</p>
            <h2 className="mt-5 text-2xl font-semibold">Quote Chats</h2>
            <p className="mt-2 text-sm text-white/40">Talk with customers, review photos, and send exact quotes.</p>
          </a>
          <a href="/admin/support" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#FF2D2D]/45">
            <p className="text-3xl">↗</p>
            <h2 className="mt-5 text-2xl font-semibold">Support</h2>
            <p className="mt-2 text-sm text-white/40">View support conversations, reply to customers, and update ticket status.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
