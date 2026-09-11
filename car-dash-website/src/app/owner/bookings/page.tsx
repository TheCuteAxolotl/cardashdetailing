"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  serviceName: string;
  serviceMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string | null;
  preferredDate: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const data = await response.json();
      if (data.user.role === "admin") return window.location.assign("/admin/bookings");
      if (data.user.role !== "owner") return window.location.assign("/");
    })();
  }, []);

  const load = async () => {
    const response = await fetch("/api/bookings", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load bookings");
    setBookings(await response.json());
  };

  useEffect(() => {
    load()
      .catch(() => setMessage("Could not load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setMessage("");

    const response = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      return setMessage("Could not update booking status.");
    }

    await load();
  };

  const deleteBooking = async (booking: Booking) => {
    const okay = window.confirm(
      `Permanently delete this ${booking.status} booking from ${booking.customerName}? This cannot be undone.`
    );

    if (!okay) return;

    setMessage("");
    setDeletingId(booking.id);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Could not delete booking.");
        return;
      }

      setMessage("Booking deleted permanently.");
      await load();
    } catch {
      setMessage("Could not delete booking.");
    } finally {
      setDeletingId(null);
    }
  };

  const visible = bookings.filter(
    (booking) => filter === "all" || booking.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] p-12 text-white">
        Loading bookings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-sm text-neutral-400">
              Customer requests from the website. Completed and cancelled bookings can be permanently deleted by the owner.
            </p>
          </div>

          <a
            href="/owner/dashboard"
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium"
          >
            Back
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === status ? "bg-red-700" : "bg-neutral-800"
                }`}
              >
                {status[0].toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {message && (
          <p className="mb-6 rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-200">
            {message}
          </p>
        )}

        <div className="space-y-5">
          {visible.map((booking) => {
            const canDelete = ["completed", "cancelled"].includes(
              booking.status
            );

            return (
              <article
                key={booking.id}
                className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {booking.serviceName}
                      </h2>

                      <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase text-neutral-300">
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-neutral-300 sm:grid-cols-2">
                      <p>
                        <strong className="text-white">Customer:</strong>{" "}
                        {booking.customerName}
                      </p>

                      <p>
                        <strong className="text-white">Phone:</strong>{" "}
                        <a
                          href={`tel:${booking.customerPhone}`}
                          className="underline"
                        >
                          {booking.customerPhone}
                        </a>
                      </p>

                      <p>
                        <strong className="text-white">Email:</strong>{" "}
                        <a
                          href={`mailto:${booking.customerEmail}`}
                          className="underline"
                        >
                          {booking.customerEmail}
                        </a>
                      </p>

                      <p>
                        <strong className="text-white">Vehicle:</strong>{" "}
                        {booking.vehicleYear} {booking.vehicleMake}{" "}
                        {booking.vehicleModel} {booking.vehicleTrim || ""}
                      </p>

                      <p>
                        <strong className="text-white">Method:</strong>{" "}
                        {booking.serviceMethod}
                      </p>

                      <p>
                        <strong className="text-white">Preferred:</strong>{" "}
                        {booking.preferredDate || "Not specified"}
                      </p>
                    </div>

                    {booking.notes && (
                      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-neutral-900 p-4 text-xs leading-6 text-neutral-300">
                        {booking.notes}
                      </pre>
                    )}
                  </div>

                  <div className="flex min-w-48 flex-col gap-2">
                    <button
                      onClick={() => updateStatus(booking.id, "confirmed")}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm"
                    >
                      Confirm
                    </button>

                    <button
                      onClick={() => updateStatus(booking.id, "completed")}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => updateStatus(booking.id, "cancelled")}
                      className="rounded-lg bg-red-800 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => deleteBooking(booking)}
                        disabled={deletingId === booking.id}
                        className="mt-2 rounded-lg border border-red-700/70 bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === booking.id
                          ? "Deleting…"
                          : "Delete booking"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {!visible.length && (
            <p className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 text-neutral-400">
              No bookings in this view.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
