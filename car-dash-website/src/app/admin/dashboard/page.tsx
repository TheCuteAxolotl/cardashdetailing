"use client";

import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role: string };

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);

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

  if (!user) return <div className="min-h-screen bg-[#050505] p-12 text-white">Loading staff dashboard…</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#00F2FE]">Staff</p>
        <h1 className="mt-2 text-4xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-white/45">Signed in as {user.email}. This account has access to bookings, support, and customer quote chats.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <a href="/admin/bookings" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#00F2FE]/45">
            <p className="text-3xl">📅</p>
            <h2 className="mt-5 text-2xl font-semibold">Bookings</h2>
            <p className="mt-2 text-sm text-white/40">View customer booking requests and update their status.</p>
          </a>
          <a href="/admin/quotes" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#00F2FE]/45">
            <p className="text-3xl">💬</p>
            <h2 className="mt-5 text-2xl font-semibold">Quote Chats</h2>
            <p className="mt-2 text-sm text-white/40">Talk with customers, review photos, and send exact quotes.</p>
          </a>
          <a href="/admin/support" className="rounded-3xl border border-white/10 bg-white/[.025] p-8 transition hover:border-[#00F2FE]/45">
            <p className="text-3xl">↗</p>
            <h2 className="mt-5 text-2xl font-semibold">Support</h2>
            <p className="mt-2 text-sm text-white/40">View support conversations, reply to customers, and update ticket status.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
