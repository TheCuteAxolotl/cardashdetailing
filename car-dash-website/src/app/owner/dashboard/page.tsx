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
          window.location.assign("/");
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
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F2FE]"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Owner Dashboard</h1>
            <p className="text-sm text-neutral-400">Welcome back, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-[#00F2FE] text-[#0D0D0D] hover:bg-[#67F7FF] transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/owner/website">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">✦</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Website Editor</h2>
              <p className="text-neutral-400 text-sm">Edit homepage, FAQ, About, page copy, and public site wording</p>
            </div>
          </a>
          {/* Services Management */}
          <a href="/owner/services">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Services</h2>
              <p className="text-neutral-400 text-sm">Edit service descriptions and prices</p>
            </div>
          </a>

          {/* Images/Gallery Management */}
          <a href="/owner/gallery">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Gallery</h2>
              <p className="text-neutral-400 text-sm">Upload hero backgrounds, section photos, and gallery images across the site</p>
            </div>
          </a>

          {/* Bookings Management */}
          <a href="/owner/bookings">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Bookings</h2>
              <p className="text-neutral-400 text-sm">View and manage customer bookings</p>
            </div>
          </a>

          <a href="/owner/quotes">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">💬</span></div>
              <h2 className="text-xl font-semibold mb-2">Quote Chats</h2>
              <p className="text-neutral-400 text-sm">Talk with customers, review photos, and send exact quotes</p>
            </div>
          </a>

          <a href="/owner/warranties">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">🛡️</span></div>
              <h2 className="text-xl font-semibold mb-2">Ceramic Warranties</h2>
              <p className="text-neutral-400 text-sm">Create and manage customer coating warranty records</p>
            </div>
          </a>

          <a href="/owner/analytics">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">↗</span></div>
              <h2 className="text-xl font-semibold mb-2">Analytics</h2>
              <p className="text-neutral-400 text-sm">Bookings, leads, customers, and accepted quote value</p>
            </div>
          </a>

          <a href="/owner/support">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4"><span className="text-2xl">↗</span></div>
              <h2 className="text-xl font-semibold mb-2">Support</h2>
              <p className="text-neutral-400 text-sm">Reply to website support chats and block repeat spam</p>
            </div>
          </a>

          <a href="/owner/admins">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Admin Accounts</h2>
              <p className="text-neutral-400 text-sm">Create or delete staff accounts with bookings and support access only</p>
            </div>
          </a>

          {/* Settings */}
          <a href="/owner/settings">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-[#00F2FE]/45 transition cursor-pointer">
              <div className="rounded-2xl bg-[#00F2FE]/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-neutral-400 text-sm">Update your account and preferences</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
