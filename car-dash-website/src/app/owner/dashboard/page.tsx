"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsUnread, setSmsUnread] = useState(0);

  useEffect(() => {
    // Check if user is logged in and is owner
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.assign("/login");
          return;
        }
        const data = await response.json();
        if (data.user.role !== "owner") {
          window.location.assign(data.staffAccess ? "/admin/dashboard" : "/");
          return;
        }
        setUser(data.user);
      } catch (error) {
        window.location.assign("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07131B] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6EAEC6]"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#07131B] text-white">
      {/* Header */}
      <header className="border-b border-[#27404F] bg-[#0B1822]">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Owner Dashboard</h1>
            <p className="text-sm text-white/52">Welcome back, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-[#6EAEC6] text-[#0B1822] hover:bg-[#6EAEC6] transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <a href="/staff-guide">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">◎</span></div>
              <h2 className="text-xl font-semibold mb-2">Staff Guide</h2>
              <p className="text-white/52 text-sm">Rules, professionalism standards, support scripts, call handling, quote chat, booking chat, and SMS guidance</p>
            </div>
          </a>
          <a href="/owner/website">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">✦</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Website Editor</h2>
              <p className="text-white/52 text-sm">Edit homepage, FAQ, About, page copy, and public site wording</p>
            </div>
          </a>
          <a href="/owner/pricing-pages">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">$</span></div>
              <h2 className="text-xl font-semibold mb-2">Pricing Pages</h2>
              <p className="text-white/52 text-sm">Customize Car Packages, Exterior, and Interior fixed pricing pages</p>
            </div>
          </a>

          <a href="/owner/booking-settings">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">◷</span></div>
              <h2 className="text-xl font-semibold mb-2">Booking Settings</h2>
              <p className="text-white/52 text-sm">Set available days and times, block off dates, and manage booking add-ons and discount codes</p>
            </div>
          </a>

          {/* Services Management */}
          <a href="/owner/services">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Services</h2>
              <p className="text-white/52 text-sm">Edit service descriptions and prices</p>
            </div>
          </a>

          {/* Images/Gallery Management */}
          <a href="/owner/gallery">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Photos & Media</h2>
              <p className="text-white/52 text-sm">Upload photos with clear page and section labels so you always know where they appear</p>
            </div>
          </a>

          {/* Bookings Management */}
          <a href="/owner/bookings">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Bookings</h2>
              <p className="text-white/52 text-sm">View and manage customer bookings</p>
            </div>
          </a>

          <a href="/owner/messages">
            <div className="relative rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              {smsUnread > 0 && (
                <span className="absolute right-5 top-5 rounded-full bg-[#6EAEC6] px-2.5 py-1 text-xs font-bold text-[#0B1822]">
                  {smsUnread}
                </span>
              )}
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">SMS Inbox</h2>
              <p className="text-white/52 text-sm">See customer text replies and open the booking conversation to text back</p>
            </div>
          </a>

          <a href="/owner/calls">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">☎</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Business Phone</h2>
              <p className="text-white/52 text-sm">Forward Car Dash calls to your phone, review call history, and block unwanted callers</p>
            </div>
          </a>

          <a href="/owner/quotes">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">💬</span></div>
              <h2 className="text-xl font-semibold mb-2">Quote Chats</h2>
              <p className="text-white/52 text-sm">Talk with customers, review photos, and send exact quotes</p>
            </div>
          </a>

          <a href="/owner/warranties">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">🛡️</span></div>
              <h2 className="text-xl font-semibold mb-2">Ceramic Warranties</h2>
              <p className="text-white/52 text-sm">Create and manage customer coating warranty records</p>
            </div>
          </a>

          <a href="/owner/analytics">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">↗</span></div>
              <h2 className="text-xl font-semibold mb-2">Analytics</h2>
              <p className="text-white/52 text-sm">Bookings, leads, customers, and accepted quote value</p>
            </div>
          </a>

          <a href="/owner/support">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">↗</span></div>
              <h2 className="text-xl font-semibold mb-2">Support</h2>
              <p className="text-white/52 text-sm">Reply to website support chats and block repeat spam</p>
            </div>
          </a>

          <a href="/owner/admins">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Staff & Accounts</h2>
              <p className="text-white/52 text-sm">Manage customers, Admin access, custom roles, dashboard permissions, and account information</p>
            </div>
          </a>

          {/* Settings */}
          <a href="/owner/settings">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 hover:border-[#6EAEC6]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#6EAEC6]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-white/52 text-sm">Update your account and preferences</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
