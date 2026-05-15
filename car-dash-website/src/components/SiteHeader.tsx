"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#050505]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-white hover:text-red-600 transition">
          Car Dash Detailing
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-neutral-300 md:flex">
          <Link href="/services" className="transition hover:text-red-600">Services</Link>
          <Link href="/gallery" className="transition hover:text-red-600">Gallery</Link>
          <Link href="/reviews" className="transition hover:text-red-600">Reviews</Link>
          <Link href="/contact" className="transition hover:text-red-600">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          {!loading && user ? (
            <>
              {user.role === "owner" && (
                <Link
                  href="/owner/dashboard"
                  className="text-sm text-neutral-300 hover:text-red-600 transition"
                >
                  Dashboard
                </Link>
              )}
              <span className="text-sm text-neutral-400">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-300 hover:text-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-300 hover:text-red-600 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm text-neutral-300 hover:text-red-600 transition"
              >
                Register
              </Link>
            </>
          )}
          <Link
            href="/contact"
            className="rounded-full border border-neutral-800 bg-red-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
