"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  serviceName: string;
  status: string;
  preferredDate?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const authResponse = await fetch("/api/auth/me");
        if (!authResponse.ok) {
          router.push("/login");
          return;
        }

        const authData = await authResponse.json();
        const currentUser = authData.user as User;

        if (currentUser.role === "owner") {
          router.push("/owner/dashboard");
          return;
        }

        setUser(currentUser);

        const bookingResponse = await fetch("/api/bookings");
        if (!bookingResponse.ok) {
          return;
        }

        const bookingData = await bookingResponse.json();
        setBookings(bookingData);
      } catch (error) {
        console.error(error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
          <p className="mt-4">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-3xl font-semibold">My Dashboard</h1>
          <p className="mt-2 text-neutral-400">Welcome back, {user.name}. Manage your upcoming bookings and account details.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-red-600">Account</p>
            <h2 className="mt-4 text-xl font-semibold text-white">{user.name}</h2>
            <p className="mt-2 text-sm text-neutral-400">{user.email}</p>
            <p className="mt-4 text-sm text-neutral-400">Client dashboard gives you a place to review your upcoming appointments, status updates, and contact details.</p>
          </div>
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-red-600">Bookings</p>
            <h2 className="mt-4 text-xl font-semibold text-white">{bookings.length}</h2>
            <p className="mt-2 text-sm text-neutral-400">Bookings in your account</p>
          </div>
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-red-600">Next step</p>
            <h2 className="mt-4 text-xl font-semibold text-white">{bookings.length ? "Check your booking details" : "Create a booking"}</h2>
            <p className="mt-2 text-sm text-neutral-400">Use the contact form to submit new requests and manage current appointments.</p>
          </div>
        </div>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Your Bookings</h2>
              <p className="text-sm text-neutral-400">Review request status and appointment details.</p>
            </div>
          </div>

          {bookings.length > 0 ? (
            <div className="mt-6 space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-3xl border border-neutral-800 bg-[#090909] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{booking.serviceName}</p>
                      <p className="text-sm text-neutral-400">Preferred: {booking.preferredDate || new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full border border-neutral-800 bg-red-700 px-4 py-2 text-sm font-semibold text-white">{booking.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-400">
              <p>No bookings found yet. Submit a booking request from the contact page to get started.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
