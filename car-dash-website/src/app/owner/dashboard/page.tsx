"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and is owner
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        if (data.user.role !== "owner") {
          router.push("/");
          return;
        }
        setUser(data.user);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
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
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Services Management */}
          <Link href="/owner/services">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-red-700 transition cursor-pointer">
              <div className="rounded-2xl bg-red-700/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Services</h2>
              <p className="text-neutral-400 text-sm">Edit service descriptions and prices</p>
            </div>
          </Link>

          {/* Images/Gallery Management */}
          <Link href="/owner/gallery">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-red-700 transition cursor-pointer">
              <div className="rounded-2xl bg-red-700/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Gallery</h2>
              <p className="text-neutral-400 text-sm">Upload and manage gallery images</p>
            </div>
          </Link>

          {/* Reviews Management */}
          <Link href="/owner/reviews">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-red-700 transition cursor-pointer">
              <div className="rounded-2xl bg-red-700/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Reviews</h2>
              <p className="text-neutral-400 text-sm">Accept or reject pending reviews</p>
            </div>
          </Link>

          {/* Bookings Management */}
          <Link href="/owner/bookings">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-red-700 transition cursor-pointer">
              <div className="rounded-2xl bg-red-700/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Bookings</h2>
              <p className="text-neutral-400 text-sm">View and manage customer bookings</p>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/owner/settings">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 hover:border-red-700 transition cursor-pointer">
              <div className="rounded-2xl bg-red-700/10 p-4 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-neutral-400 text-sm">Update your account and preferences</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
