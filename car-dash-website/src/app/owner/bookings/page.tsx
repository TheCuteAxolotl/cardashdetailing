"use client";

import { useEffect, useState } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import BookingPhotoEvidence from "@/components/BookingPhotoEvidence";

const input = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#6EAEC6]/60";

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
  preferredTime?: string | null;
  quotedPrice: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

type ManualBookingForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  serviceMethod: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  preferredDate: string;
  preferredTime: string;
  quotedPrice: string;
  notes: string;
};

const EMPTY_MANUAL: ManualBookingForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  serviceName: "Outside Booking",
  serviceMethod: "mobile",
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleTrim: "",
  preferredDate: "",
  preferredTime: "",
  quotedPrice: "",
  notes: "",
};

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [arrivalSendingId, setArrivalSendingId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<ManualBookingForm>(EMPTY_MANUAL);
  const [manualSaving, setManualSaving] = useState(false);
  const [scheduleEditingId, setScheduleEditingId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ date: "", time: "" });
  const [scheduleSaving, setScheduleSaving] = useState(false);

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
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "Could not update booking status.");
    await load();
  };

  const submitManualBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setManualSaving(true);
    try {
      const response = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Could not add the booking.");
        return;
      }
      setManual(EMPTY_MANUAL);
      setShowManual(false);
      setMessage("Outside booking added. That time is now blocked from online booking.");
      await load();
    } catch {
      setMessage("Could not add the booking.");
    } finally {
      setManualSaving(false);
    }
  };

  const startScheduleEdit = (booking: Booking) => {
    setScheduleEditingId(booking.id);
    setScheduleDraft({
      date: booking.preferredDate || "",
      time: normalizeBookingTime(booking.preferredTime) || "",
    });
  };

  const saveSchedule = async (booking: Booking) => {
    setMessage("");
    setScheduleSaving(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredDate: scheduleDraft.date, preferredTime: scheduleDraft.time }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Could not change the booking time.");
        return;
      }
      setScheduleEditingId(null);
      setMessage("Booking date and time updated.");
      await load();
    } catch {
      setMessage("Could not change the booking time.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const deleteBooking = async (booking: Booking) => {
    const okay = window.confirm(`Permanently delete this ${booking.status} booking from ${booking.customerName}? This cannot be undone.`);
    if (!okay) return;

    setMessage("");
    setDeletingId(booking.id);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
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

  const sendArrivalUpdate = async (booking: Booking, mode: "on_the_way" | "eta") => {
    let eta = "";
    if (mode === "eta") {
      eta = window.prompt("What time should the customer expect you? Example: 2:30 PM")?.trim() || "";
      if (!eta) return;
    }

    setMessage("");
    setArrivalSendingId(booking.id);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/arrival`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, eta }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Could not send the arrival text.");
        return;
      }
      setMessage(`Arrival text sent to ${booking.customerName}.`);
    } catch {
      setMessage("Could not send the arrival text.");
    } finally {
      setArrivalSendingId(null);
    }
  };

  const visible = bookings.filter((booking) => filter === "all" || booking.status === filter);

  if (loading) {
    return <div className="min-h-screen bg-[#07131B] p-12 text-white">Loading bookings…</div>;
  }

  return (
    <div className="min-h-screen bg-[#07131B] text-white">
      <header className="border-b border-[#27404F] bg-[#0B1822]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-sm text-white/52">Manage website bookings, change appointment times, and add jobs that were booked outside the website.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/owner/booking-settings" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium">Availability</a>
            <button type="button" onClick={() => setShowManual((value) => !value)} className="rounded-lg border border-[#6EAEC6]/30 bg-[#6EAEC6]/10 px-4 py-2 text-sm font-semibold text-[#6EAEC6]">{showManual ? "Close form" : "+ Add outside booking"}</button>
            <a href="/owner/dashboard" className="rounded-lg bg-[#6EAEC6] px-4 py-2 text-sm font-medium text-[#0B1822]">Back</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {showManual && (
          <form onSubmit={submitManualBooking} className="mb-8 rounded-3xl border border-[#6EAEC6]/25 bg-[#6EAEC6]/[.04] p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Manual Booking</p>
              <h2 className="mt-2 text-2xl font-semibold">Add a booking from somewhere else</h2>
              <p className="mt-2 text-sm text-white/40">Use this when someone books by phone, text, in person, or anywhere outside the website. Saving it blocks the same date and time from online booking.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm text-white/55">Customer name<input className={`${input} mt-2`} value={manual.customerName} onChange={(e) => setManual((current) => ({ ...current, customerName: e.target.value }))} required /></label>
              <label className="text-sm text-white/55">Phone<input className={`${input} mt-2`} value={manual.customerPhone} onChange={(e) => setManual((current) => ({ ...current, customerPhone: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Email<input type="email" className={`${input} mt-2`} value={manual.customerEmail} onChange={(e) => setManual((current) => ({ ...current, customerEmail: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Service<input className={`${input} mt-2`} value={manual.serviceName} onChange={(e) => setManual((current) => ({ ...current, serviceName: e.target.value }))} required /></label>
              <label className="text-sm text-white/55">Method<select className={`${input} mt-2`} value={manual.serviceMethod} onChange={(e) => setManual((current) => ({ ...current, serviceMethod: e.target.value }))}><option value="mobile">Mobile</option><option value="shop">Shop</option><option value="other">Other</option></select></label>
              <label className="text-sm text-white/55">Price (optional)<input type="number" min="0" step="0.01" className={`${input} mt-2`} value={manual.quotedPrice} onChange={(e) => setManual((current) => ({ ...current, quotedPrice: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle year<input className={`${input} mt-2`} value={manual.vehicleYear} onChange={(e) => setManual((current) => ({ ...current, vehicleYear: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle make<input className={`${input} mt-2`} value={manual.vehicleMake} onChange={(e) => setManual((current) => ({ ...current, vehicleMake: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle model<input className={`${input} mt-2`} value={manual.vehicleModel} onChange={(e) => setManual((current) => ({ ...current, vehicleModel: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle trim<input className={`${input} mt-2`} value={manual.vehicleTrim} onChange={(e) => setManual((current) => ({ ...current, vehicleTrim: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Date<input type="date" className={`${input} mt-2`} value={manual.preferredDate} onChange={(e) => setManual((current) => ({ ...current, preferredDate: e.target.value }))} required /></label>
              <label className="text-sm text-white/55">Time<input type="time" className={`${input} mt-2`} value={manual.preferredTime} onChange={(e) => setManual((current) => ({ ...current, preferredTime: e.target.value }))} required /></label>
            </div>
            <label className="mt-4 block text-sm text-white/55">Notes<textarea className={`${input} mt-2 min-h-24`} value={manual.notes} onChange={(e) => setManual((current) => ({ ...current, notes: e.target.value }))} placeholder="Anything you want saved with this booking" /></label>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" disabled={manualSaving} className="rounded-full bg-[#6EAEC6] px-6 py-3 font-semibold text-[#0B1822] disabled:opacity-50">{manualSaving ? "Adding…" : "Add & Block Time"}</button>
              <button type="button" onClick={() => { setShowManual(false); setManual(EMPTY_MANUAL); }} className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/60">Cancel</button>
            </div>
          </form>
        )}

        <div className="mb-8 flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === status ? "bg-[#6EAEC6] text-[#0B1822]" : "bg-[#1B3241]"}`}>
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {message && <p className="mb-6 rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-100">{message}</p>}

        <div className="space-y-5">
          {visible.map((booking) => {
            const canDelete = ["completed", "cancelled"].includes(booking.status);
            const editingSchedule = scheduleEditingId === booking.id;
            return (
              <article key={booking.id} className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">{booking.serviceName}</h2>
                      <span className="rounded-full border border-[#365262] px-3 py-1 text-xs uppercase text-white/72">{booking.status}</span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-white/72 sm:grid-cols-2">
                      <p><strong className="text-white">Customer:</strong> {booking.customerName}</p>
                      <p><strong className="text-white">Phone:</strong> {booking.customerPhone ? <a href={`tel:${booking.customerPhone}`} className="underline">{booking.customerPhone}</a> : "Not provided"}</p>
                      <p><strong className="text-white">Email:</strong> {booking.customerEmail ? <a href={`mailto:${booking.customerEmail}`} className="underline">{booking.customerEmail}</a> : "Not provided"}</p>
                      <p><strong className="text-white">Vehicle:</strong> {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel} {booking.vehicleTrim || ""}</p>
                      <p><strong className="text-white">Method:</strong> {booking.serviceMethod}</p>
                      <p><strong className="text-white">Scheduled:</strong> {booking.preferredDate || "Not specified"}{booking.preferredTime ? ` · ${booking.preferredTime}` : ""}</p>
                      <p><strong className="text-white">Booking total:</strong> <span className="font-semibold text-emerald-300">{booking.quotedPrice != null ? `$${booking.quotedPrice.toFixed(2)}` : "Not entered"}</span></p>
                    </div>

                    {editingSchedule && (
                      <div className="mt-4 max-w-xl rounded-2xl border border-[#6EAEC6]/25 bg-[#6EAEC6]/5 p-4">
                        <p className="text-sm font-semibold">Change date / time</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs text-white/50">Date<input type="date" className={`${input} mt-1`} value={scheduleDraft.date} onChange={(e) => setScheduleDraft((current) => ({ ...current, date: e.target.value }))} /></label>
                          <label className="text-xs text-white/50">Time<input type="time" className={`${input} mt-1`} value={scheduleDraft.time} onChange={(e) => setScheduleDraft((current) => ({ ...current, time: e.target.value }))} /></label>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button type="button" disabled={scheduleSaving} onClick={() => saveSchedule(booking)} className="rounded-full bg-[#6EAEC6] px-4 py-2 text-sm font-semibold text-[#0B1822] disabled:opacity-50">{scheduleSaving ? "Saving…" : "Save time"}</button>
                          <button type="button" onClick={() => setScheduleEditingId(null)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">Cancel</button>
                        </div>
                      </div>
                    )}

                    <BookingPhotoEvidence notes={booking.notes} />
                  </div>

                  <div className="flex min-w-48 flex-col gap-2">
                    <button type="button" onClick={() => startScheduleEdit(booking)} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">Edit date / time</button>
                    <a href={`/booking-chat/${booking.id}`} className="rounded-lg border border-[#6EAEC6]/30 bg-[#6EAEC6]/10 px-4 py-2 text-center text-sm font-semibold text-[#6EAEC6]">Text / chat customer</a>

                    {!canDelete && (
                      <>
                        <button onClick={() => sendArrivalUpdate(booking, "on_the_way")} disabled={arrivalSendingId === booking.id} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50">{arrivalSendingId === booking.id ? "Sending…" : "On my way SMS"}</button>
                        <button onClick={() => sendArrivalUpdate(booking, "eta")} disabled={arrivalSendingId === booking.id} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 disabled:opacity-50">Send arrival time</button>
                      </>
                    )}
                    <button onClick={() => updateStatus(booking.id, "confirmed")} className="rounded-lg bg-blue-700 px-4 py-2 text-sm">Confirm</button>
                    <button onClick={() => updateStatus(booking.id, "completed")} className="rounded-lg bg-green-700 px-4 py-2 text-sm">Complete</button>
                    <button onClick={() => updateStatus(booking.id, "cancelled")} className="rounded-lg bg-red-800 px-4 py-2 text-sm">Cancel</button>

                    {canDelete && (
                      <button onClick={() => deleteBooking(booking)} disabled={deletingId === booking.id} className="mt-2 rounded-lg border border-red-700/70 bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50">
                        {deletingId === booking.id ? "Deleting…" : "Delete booking"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {!visible.length && <p className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 text-white/52">No bookings in this view.</p>}
        </div>
      </main>
    </div>
  );
}
