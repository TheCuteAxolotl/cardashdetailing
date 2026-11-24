"use client";


import { useEffect, useState } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import DetailReport from "@/components/DetailReport";
import BookingCertificateButton from "@/components/BookingCertificateButton";
import BookingPhotoEvidence from "@/components/BookingPhotoEvidence";
import BookingDetailsEditor from "@/components/BookingDetailsEditor";
import OwnerBookingModal from "@/components/OwnerBookingModal";
import BookingPaidReceiptDialog from "@/components/BookingPaidReceiptDialog";
import BookingReminderDialog from "@/components/BookingReminderDialog";
import BusinessCallButton from "@/components/BusinessCallButton";
import { bookingServiceAddress } from "@/lib/booking-owner-details";
import OwnerServicePricing from "@/components/OwnerServicePricing";
import { KEEP_SERVICE_KEY, type CatalogSource } from "@/lib/booking-catalog";
import type { VehicleClass } from "@/lib/pricing-config";

const input = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#6EAEC6]/60";

type Booking = {
  bookingNumber?: string;
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
  updatedAt?: string;
};

type SavedClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

type ManualBookingForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sendConfirmationSms: boolean;
  serviceName: string;
  serviceMethod: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  preferredDate: string;
  preferredTime: string;
  quotedPrice: string;
  serviceAddress: string;
  notes: string;
  vehicleClass: VehicleClass;
  serviceKey: string;
  customServiceName: string;
  pricingMode: "listed" | "custom";
  customPrice: string;
  addOnIds: string[];
};

const EMPTY_MANUAL: ManualBookingForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  sendConfirmationSms: true,
  serviceName: "Outside Booking",
  serviceMethod: "mobile",
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleTrim: "",
  preferredDate: "",
  preferredTime: "",
  quotedPrice: "",
  serviceAddress: "",
  notes: "",
  vehicleClass: "coupe",
  serviceKey: "",
  customServiceName: "",
  pricingMode: "listed",
  customPrice: "",
  addOnIds: [],
};

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [arrivalSendingId, setArrivalSendingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [catalogSource, setCatalogSource] = useState<CatalogSource | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<ManualBookingForm>(EMPTY_MANUAL);
  const [manualSaving, setManualSaving] = useState(false);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [savedClientsLoading, setSavedClientsLoading] = useState(false);
  const [savedClientsError, setSavedClientsError] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [reminderBooking, setReminderBooking] = useState<Booking | null>(null);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") !== "1") return;
    setConvertingId(null);
    // CRM leads can prefill a draft, but only an explicit Add & Block Time
    // submission can create a booking or send the confirmation text.
    const fields = ["customerName","customerEmail","customerPhone","serviceName",
      "vehicleYear","vehicleMake","vehicleModel","serviceAddress"] as const;
    const draft:Partial<ManualBookingForm>={};
    const date = params.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) draft.preferredDate = date;
    const time = params.get("time");
    if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) draft.preferredTime = time;
    let stored:Record<string,unknown>={};
    if(params.get("from")==="crm"){
      try{
        const raw=window.sessionStorage.getItem("car-dash-crm-booking-draft");
        if(raw)stored=JSON.parse(raw) as Record<string,unknown>;
        window.sessionStorage.removeItem("car-dash-crm-booking-draft");
      }catch{stored={};}
    }
    for(const key of fields){
      const value=typeof stored[key]==="string"?(stored[key] as string).trim():params.get(key)?.trim();
      if(value && value.length<=240) Object.assign(draft,{[key]:value});
    }
    setManual(prev=>({...prev,...draft}));
    setShowManual(true);
  }, []);

  // Existing bookings, quotes, and CRM profiles all contribute to the saved client list.
  // The CRM endpoint is owner-only and prevents private customer data being exposed publicly.
  useEffect(() => {
    if (!showManual) return;
    const controller = new AbortController();
    setSavedClientsLoading(true);
    setSavedClientsError("");
    setSavedClients([]);
    fetch("/api/crm", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("CRM unavailable");
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const raw = (Array.isArray(data.customers) ? data.customers : []) as Array<{
          id: string;
          name: string;
          phone: string;
          email: string;
          profile?: { name?: string; phone?: string; email?: string };
        }>;
        const unique = new Map<string, SavedClient>();
        for (const customer of raw) {
          const name = String(customer.profile?.name || customer.name || "").trim();
          const phone = String(customer.profile?.phone || customer.phone || "").trim();
          const email = String(customer.profile?.email || customer.email || "").trim();
          if (!name || name === "New lead") continue;
          const id = String(customer.id || "");
          if (!id) continue;
          const key = [name.toLowerCase(), phone.replace(/\D/g, ""), email.toLowerCase()].join("|");
          if (!unique.has(key)) unique.set(key, { id, name, phone, email });
        }
        setSavedClients([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        if (!controller.signal.aborted) setSavedClientsError("Saved clients could not be loaded. You can still enter a new customer below.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSavedClientsLoading(false);
      });
    return () => controller.abort();
  }, [showManual]);

  useEffect(() => {
    if (!showManual) return;
    let cancelled = false;
    setCatalogLoading(true);
    fetch("/api/site-content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled && data) setCatalogSource(data as CatalogSource); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [showManual]);

  const selectSavedClient = (id: string) => {
    setSelectedClientId(id);
    setClientSearch("");
    const client = savedClients.find((item) => item.id === id);
    if (client) {
      setManual((current) => ({
        ...current,
        customerName: client.name,
        customerPhone: client.phone,
        customerEmail: client.email,
      }));
    } else {
      setManual((current) => ({
        ...current,
        customerName: "",
        customerPhone: "",
        customerEmail: "",
      }));
    }
  };

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
      const response = await fetch(convertingId ? `/api/bookings/${convertingId}` : "/api/bookings/manual", {
        method: convertingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...manual, ...(convertingId ? {action:"confirmWithDetails"} : {})}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Could not add the booking.");
        return;
      }
      setConvertingId(null);
      setManual(EMPTY_MANUAL);
      setSelectedClientId("");
      setClientSearch("");
      setShowManual(false);
      if (convertingId) {
        setMessage("Booking request confirmed and added to the schedule.");
      } else if (data.confirmationSms?.status === "sent") {
        setMessage("Booking saved and confirmation text sent to the customer's number.");
      } else if (data.confirmationSms?.status === "failed") {
        setMessage("Booking saved and time blocked, but the confirmation text could not be sent. Check the number and your SMS settings before notifying the customer.");
      } else if (data.confirmationSms?.reason === "missing_phone") {
        setMessage("Booking saved and time blocked. No confirmation text was sent because no phone number was entered.");
      } else {
        setMessage("Booking saved and time blocked. Automatic confirmation text was turned off.");
      }
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
    const okay = window.confirm(`Archive this ${booking.status} booking from ${booking.customerName}? The owner can restore it from history.`);
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
      setMessage("Booking archived.");
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
        method: convertingId ? "PUT" : "POST",
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
            <button type="button" onClick={() => { setConvertingId(null); setManual(EMPTY_MANUAL); setSelectedClientId(""); setClientSearch(""); setShowManual((value) => !value); }} className="rounded-lg border border-[#6EAEC6]/30 bg-[#6EAEC6]/10 px-4 py-2 text-sm font-semibold text-[#6EAEC6]">{showManual ? "Close form" : "+ Add outside booking"}</button>
            <a href="/owner/dashboard" className="rounded-lg bg-[#6EAEC6] px-4 py-2 text-sm font-medium text-[#0B1822]">Back</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <OwnerBookingModal
          open={showManual}
          title={convertingId ? "Confirm booking request" : "New manual booking"}
          onClose={() => { if (manualSaving) return; setShowManual(false); setConvertingId(null); setManual(EMPTY_MANUAL); setSelectedClientId(""); setClientSearch(""); }}
        >
          <form id="owner-manual-booking" onSubmit={submitManualBooking} className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Manual Booking</p>
              <h2 className="mt-2 text-2xl font-semibold">{convertingId ? "Confirm request and add to schedule" : "Add a booking from somewhere else"}</h2>
              <p className="mt-2 text-sm text-white/40">Use this when someone books by phone, text, in person, or anywhere outside the website. Saving it blocks the same date and time from online booking.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-[#d6b779]/30 bg-[#d6b779]/[.06] p-4 md:col-span-2 lg:col-span-3">
                <p className="text-sm font-semibold text-[#e8d5af]">Choose a saved client</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-white/65">Search by name or phone
                    <input type="search" autoComplete="off" className={`${input} mt-2`} placeholder="Search saved clients…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  </label>
                  <label className="text-xs text-white/65">Existing client
                    <select className={`${input} mt-2`} value={selectedClientId} onChange={(e) => selectSavedClient(e.target.value)}>
                      <option value="">New client / enter manually</option>
                      {savedClients.filter((client) => client.id === selectedClientId || [client.name, client.phone, client.email].some((value) => value.toLowerCase().includes(clientSearch.trim().toLowerCase()))).map((client) => (
                        <option key={client.id} value={client.id}>{client.name}{client.phone ? ` · ${client.phone}` : ""}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-white/55">{savedClientsLoading ? "Loading saved clients…" : savedClientsError || (savedClients.length ? "Selecting a client fills in their name, phone, and email. You can edit any field below." : "No saved clients yet. Add a new customer below; they will be available for future bookings.")}</p>
              </div>
              <label className="text-sm text-white/55">Customer name<input className={`${input} mt-2`} value={manual.customerName} onChange={(e) => { setSelectedClientId(""); setManual((current) => ({ ...current, customerName: e.target.value })); }} required /></label>
              <label className="text-sm text-white/55">Phone<input className={`${input} mt-2`} value={manual.customerPhone} onChange={(e) => { setSelectedClientId(""); setManual((current) => ({ ...current, customerPhone: e.target.value })); }} /></label>
              {!convertingId && <label className="flex items-start gap-3 rounded-xl border border-[#d6b779]/35 bg-[#d6b779]/10 p-3 text-xs leading-5 text-[#e8d5af] md:col-span-2">
                <input type="checkbox" checked={manual.sendConfirmationSms}
                  onChange={(e) => setManual(current => ({ ...current, sendConfirmationSms: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#d6b779]" />
                <span><strong className="block text-sm text-[#f1dfb9]">Automatically send booking confirmation SMS</strong>
                  When you click Add &amp; Block Time, Car Dash will text the customer the service, appointment date, time, and price.
                  Keep this on only when the customer provided their number and agreed to receive appointment updates.
                  Without a phone number, the booking will be saved but no text will be sent.</span>
              </label>}
              <label className="text-sm text-white/55">Email<input type="email" className={`${input} mt-2`} value={manual.customerEmail} onChange={(e) => { setSelectedClientId(""); setManual((current) => ({ ...current, customerEmail: e.target.value })); }} /></label>
              <OwnerServicePricing
                value={manual}
                onChange={(patch) => setManual((current) => ({ ...current, ...patch }))}
                source={catalogSource}
                loading={catalogLoading}
                allowKeep={Boolean(convertingId)}
              />
              <label className="text-sm text-white/55">Vehicle year<input className={`${input} mt-2`} value={manual.vehicleYear} onChange={(e) => setManual((current) => ({ ...current, vehicleYear: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle make<input className={`${input} mt-2`} value={manual.vehicleMake} onChange={(e) => setManual((current) => ({ ...current, vehicleMake: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle model<input className={`${input} mt-2`} value={manual.vehicleModel} onChange={(e) => setManual((current) => ({ ...current, vehicleModel: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Vehicle trim<input className={`${input} mt-2`} value={manual.vehicleTrim} onChange={(e) => setManual((current) => ({ ...current, vehicleTrim: e.target.value }))} /></label>
              <label className="text-sm font-semibold text-[#d6b779] md:col-span-2">Service address (mobile job location)<input autoComplete="street-address" maxLength={500} placeholder="Street address, city, state, ZIP" className={`${input} mt-2`} value={manual.serviceAddress} onChange={(e) => setManual((current) => ({ ...current, serviceAddress: e.target.value }))} /></label>
              <label className="text-sm text-white/55">Date<input type="date" className={`${input} mt-2`} value={manual.preferredDate} onChange={(e) => setManual((current) => ({ ...current, preferredDate: e.target.value }))} required /></label>
              <label className="text-sm text-white/55">Time<input type="time" className={`${input} mt-2`} value={manual.preferredTime} onChange={(e) => setManual((current) => ({ ...current, preferredTime: e.target.value }))} required /></label>
            </div>
            <label className="mt-4 block text-sm text-white/55">Notes<textarea className={`${input} mt-2 min-h-24`} value={manual.notes} onChange={(e) => setManual((current) => ({ ...current, notes: e.target.value }))} placeholder="Anything you want saved with this booking" /></label>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" disabled={manualSaving} className="rounded-full bg-[#6EAEC6] px-6 py-3 font-semibold text-[#0B1822] disabled:opacity-50">{manualSaving ? "Saving…" : convertingId ? "Confirm & Add to Schedule" : "Add & Block Time"}</button>
              <button type="button" onClick={() => { setShowManual(false); setManual(EMPTY_MANUAL); setSelectedClientId(""); setClientSearch(""); }} className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/60">Cancel</button>
            </div>
          </form>
        </OwnerBookingModal>

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
                      <p><strong className="text-white">Phone:</strong> {booking.customerPhone || "Not provided"}</p>
                      <p><strong className="text-white">Email:</strong> {booking.customerEmail ? <a href={`mailto:${booking.customerEmail}`} className="underline">{booking.customerEmail}</a> : "Not provided"}</p>
                      <p><strong className="text-white">Vehicle:</strong> {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel} {booking.vehicleTrim || ""}</p>
                      <p><strong className="text-white">Method:</strong> {booking.serviceMethod}</p>
                      <p><strong className="text-white">Scheduled:</strong> {booking.preferredDate || "Not specified"}{booking.preferredTime ? ` · ${booking.preferredTime}` : ""}</p>
                      <p className="sm:col-span-2 rounded-xl border border-[#d6b779]/25 bg-[#d6b779]/[.06] p-3"><strong className="text-[#d6b779]">Service address:</strong> {bookingServiceAddress(booking.notes) ? <><span className="ml-2 text-white">{bookingServiceAddress(booking.notes)}</span> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookingServiceAddress(booking.notes))}`} rel="noopener noreferrer" target="_blank" className="ml-2 font-semibold text-[#e5c995] underline">Maps</a></> : <span className="ml-2 text-amber-200">Missing — add before your appointment</span>}</p>
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
                    <button type="button" onClick={() => setEditingBooking(booking)} className="rounded-lg bg-[#d6b779] px-4 py-3 text-sm font-bold text-[#101010]">Edit booking / address</button>
                    <button type="button" onClick={() => startScheduleEdit(booking)} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">Quick edit date / time</button>
                    {booking.customerPhone ? <a href={`/owner/messages?phone=${encodeURIComponent(booking.customerPhone)}&name=${encodeURIComponent(booking.customerName || "Customer")}`} className="rounded-lg border border-white/20 bg-[#292723] px-4 py-2 text-center text-sm font-semibold text-[#f4efe5]">Text customer · Full history</a> : <button type="button" onClick={() => setEditingBooking(booking)} className="rounded-lg border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-200">Add customer phone to text</button>}
                    {booking.customerPhone && <BusinessCallButton phoneNumber={booking.customerPhone} customerName={booking.customerName} className="rounded-lg border border-[#d6b779]/45 bg-[#d6b779]/10 px-4 py-2.5 text-sm font-semibold text-[#e9d29e] disabled:opacity-40" />}
                    {booking.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => booking.customerPhone ? setReminderBooking(booking) : setEditingBooking(booking)}
                        className="rounded-lg border border-[#6EAEC6]/35 bg-[#6EAEC6]/10 px-4 py-3 text-sm font-bold text-[#B9E0EC] hover:bg-[#6EAEC6]/20"
                      >
                        {booking.customerPhone ? "Send Reminder Now · SMS" : "Add phone to send reminder"}
                      </button>
                    )}
                  <BookingCertificateButton booking={booking} />
                  <DetailReport booking={booking} />
                    {["confirmed", "completed"].includes(booking.status) && (booking.customerPhone ? <button type="button" onClick={() => setReceiptBooking(booking)} className="rounded-lg border border-emerald-400/35 bg-emerald-400/12 px-4 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-400/20">Create receipt · SMS</button> : <button type="button" onClick={() => setEditingBooking(booking)} className="rounded-lg border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-200">Add phone to send receipt</button>)}

                    {!canDelete && (
                      <>
                        <button onClick={() => sendArrivalUpdate(booking, "on_the_way")} disabled={arrivalSendingId === booking.id} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50">{arrivalSendingId === booking.id ? "Sending…" : "On my way SMS"}</button>
                        <button onClick={() => sendArrivalUpdate(booking, "eta")} disabled={arrivalSendingId === booking.id} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 disabled:opacity-50">Send arrival time</button>
                      </>
                    )}
                    <button onClick={() => { setConvertingId(booking.id); setManual({...EMPTY_MANUAL,...booking,serviceKey:KEEP_SERVICE_KEY,vehicleTrim:booking.vehicleTrim||"",preferredDate:booking.preferredDate||"",preferredTime:normalizeBookingTime(booking.preferredTime)||"",quotedPrice:booking.quotedPrice==null?"":String(booking.quotedPrice),notes:booking.notes||""}); setShowManual(true); }} disabled={booking.status!=="pending"} className="rounded-lg bg-blue-700 px-4 py-2 text-sm disabled:opacity-40">Convert to booking</button>
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
      {reminderBooking && <BookingReminderDialog key={reminderBooking.id} booking={reminderBooking} onClose={() => setReminderBooking(null)} />}
      {receiptBooking && <BookingPaidReceiptDialog key={receiptBooking.id} booking={receiptBooking} onClose={() => setReceiptBooking(null)} />}
      {editingBooking && <BookingDetailsEditor key={editingBooking.id} booking={editingBooking} onClose={() => setEditingBooking(null)} onSaved={async () => { await load(); setMessage("Bookings updated."); }} />}
    </div>
  );
}
