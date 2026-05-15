"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
  id: string;
  serviceName: string;
  date: string;
  notes: string | null;
  status: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update booking");
      await fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    }
  };

  const filteredBookings = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );

  const statusColors: { [key: string]: string } = {
    pending: "bg-yellow-900/30 border-yellow-700 text-yellow-200",
    confirmed: "bg-blue-900/30 border-blue-700 text-blue-200",
    completed: "bg-green-900/30 border-green-700 text-green-200",
    cancelled: "bg-red-900/30 border-red-700 text-red-200",
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Bookings</h1>
            <p className="text-sm text-neutral-400">View and manage customer bookings</p>
          </div>
          <Link href="/owner/dashboard" className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium">
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                filter === status
                  ? "bg-red-700"
                  : "bg-neutral-800 hover:bg-neutral-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{booking.serviceName}</h3>
                      <span className={`px-3 py-1 rounded-full border text-xs font-medium ${statusColors[booking.status]}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-neutral-400 mb-2">
                      <strong>Customer:</strong> {booking.user.name} ({booking.user.email})
                    </p>
                    <p className="text-neutral-400 mb-2">
                      <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
                    </p>
                    {booking.notes && (
                      <p className="text-neutral-400">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    )}
                  </div>
                </div>

                {booking.status !== "completed" && booking.status !== "cancelled" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800">
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, "confirmed")}
                          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition text-sm font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, "cancelled")}
                          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, "completed")}
                          className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 transition text-sm font-medium"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, "cancelled")}
                          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-400">No bookings found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
