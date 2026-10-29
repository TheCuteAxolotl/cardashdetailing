"use client";

import { useEffect, useState, type FormEvent } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import { bookingOwnerNotes, bookingServiceAddress } from "@/lib/booking-owner-details";

export type EditableBooking = {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string | null;
  preferredDate: string | null;
  preferredTime?: string | null;
  quotedPrice: number | null;
  notes: string | null;
  updatedAt?: string | Date;
  status?: string;
};

type FormFields = {
  serviceAddress: string;
  ownerNotes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  preferredDate: string;
  preferredTime: string;
  quotedPrice: string;
};
const field = "mt-1.5 w-full rounded-xl border border-white/20 bg-[#252525] px-4 py-3 text-base text-[#f4efe5] outline-none placeholder:text-[#8f8a82] focus:border-[#d6b779] focus:ring-1 focus:ring-[#d6b779]/40";
const label = "block text-sm font-semibold text-[#d7d0c5]";

export default function BookingDetailsEditor({
  booking, onClose, onSaved,
}: {
  booking: EditableBooking;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<FormFields>({
    serviceAddress: bookingServiceAddress(booking.notes),
    ownerNotes: bookingOwnerNotes(booking.notes),
    customerName: booking.customerName || "",
    customerPhone: booking.customerPhone || "",
    customerEmail: booking.customerEmail || "",
    serviceName: booking.serviceName || "",
    vehicleYear: booking.vehicleYear || "",
    vehicleMake: booking.vehicleMake || "",
    vehicleModel: booking.vehicleModel || "",
    vehicleTrim: booking.vehicleTrim || "",
    preferredDate: booking.preferredDate || "",
    preferredTime: normalizeBookingTime(booking.preferredTime) || "",
    quotedPrice: booking.quotedPrice == null ? "" : String(booking.quotedPrice),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof FormFields, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const address = draft.serviceAddress.trim();
  const maps = address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address) : "";
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/bookings/" + encodeURIComponent(booking.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editDetails",
          ...draft,
          updatedAt: booking.updatedAt,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save this booking.");
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this booking.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="booking-editor-title">
      <button aria-label="Close booking editor" type="button" onClick={onClose} className="fixed inset-0 cursor-default" />
      <form onSubmit={save} className="relative z-10 my-0 flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border border-white/15 bg-[#191919] text-[#f4efe5] shadow-2xl sm:my-6 sm:rounded-[24px]">
        <header className="shrink-0 border-b border-white/10 bg-[#1d1d1d] px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Booking details</p>
              <h2 id="booking-editor-title" className="mt-1.5 font-serif text-2xl text-[#f4efe5] sm:text-3xl">Edit appointment</h2>
              <p className="mt-1 text-xs text-[#aaa49b]">{booking.status || "Booking"} · Changes save to this existing appointment</p>
            </div>
            <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-xl text-[#d9d2c7]">×</button>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
          <section className="rounded-2xl border border-[#d6b779]/40 bg-[#29261f] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="edit-service-address" className="text-base font-bold text-[#eed7a6]">Service address · Important</label>
              {maps && <a href={maps} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#e5c995] underline">Open in Maps</a>}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#ccc1aa]">The location where you’ll detail the vehicle. Edit it here any time, including for existing bookings.</p>
            <input id="edit-service-address" autoComplete="street-address" maxLength={500} value={draft.serviceAddress} onChange={event => update("serviceAddress", event.target.value)} placeholder="Street address, city, state, ZIP" className={field} />
            {!address && <p className="mt-2 text-xs text-amber-200">No service address saved yet.</p>}
          </section>
          <section className="space-y-3">
            <label htmlFor="edit-owner-notes" className={label}>Private job notes</label>
            <textarea id="edit-owner-notes" rows={4} maxLength={4000} value={draft.ownerNotes} onChange={event => update("ownerNotes", event.target.value)} placeholder="Gate code, parking instructions, supplies needed, customer requests, areas to focus on…" className={field} />
            <p className="text-xs leading-5 text-[#aaa49b]">These owner notes are separate from the customer’s original notes, photos, consent, and booking metadata.</p>
          </section>
          <section className="border-t border-white/10 pt-5">
            <h3 className="mb-1 text-base font-semibold text-[#f4efe5]">Appointment & price</h3><p className="mb-4 text-xs text-[#aaa49b]">For an unscheduled request, leave both date and time blank. To schedule it, enter both.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Date<input type="date" value={draft.preferredDate} onChange={event => update("preferredDate", event.target.value)} className={field}/></label>
              <label className={label}>Time<input type="time" value={draft.preferredTime} onChange={event => update("preferredTime", event.target.value)} className={field}/></label>
              <label className={label + " sm:col-span-2"}>Service<input required maxLength={240} value={draft.serviceName} onChange={event => update("serviceName", event.target.value)} className={field}/></label>
              <label className={label}>Total price ($)<input type="number" min="0" max="100000" step="0.01" value={draft.quotedPrice} onChange={event => update("quotedPrice", event.target.value)} placeholder="No price set" className={field}/></label>
            </div>
          </section>
          <section className="border-t border-white/10 pt-5">
            <h3 className="mb-4 text-base font-semibold text-[#f4efe5]">Customer & vehicle</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Customer name<input required maxLength={150} value={draft.customerName} onChange={event => update("customerName", event.target.value)} className={field}/></label>
              <label className={label}>Phone<input type="tel" maxLength={60} value={draft.customerPhone} onChange={event => update("customerPhone", event.target.value)} className={field}/></label>
              <label className={label + " sm:col-span-2"}>Email<input type="email" maxLength={240} value={draft.customerEmail} onChange={event => update("customerEmail", event.target.value)} className={field}/></label>
              <label className={label}>Vehicle year<input maxLength={20} value={draft.vehicleYear} onChange={event => update("vehicleYear", event.target.value)} className={field}/></label>
              <label className={label}>Vehicle make<input maxLength={100} value={draft.vehicleMake} onChange={event => update("vehicleMake", event.target.value)} className={field}/></label>
              <label className={label}>Vehicle model<input maxLength={100} value={draft.vehicleModel} onChange={event => update("vehicleModel", event.target.value)} className={field}/></label>
              <label className={label}>Trim<input maxLength={100} value={draft.vehicleTrim} onChange={event => update("vehicleTrim", event.target.value)} className={field}/></label>
            </div>
          </section>
        </div>
        <footer className="shrink-0 border-t border-white/10 bg-[#1d1d1d] px-5 py-4 sm:px-7">
          {error && <p role="alert" className="mb-3 rounded-lg border border-red-400/30 bg-red-900/20 p-3 text-sm text-red-200">{error}</p>}
          <p className="mb-3 text-xs leading-5 text-[#aaa49b]">Changing the appointment time checks for conflicts. A time change can notify customers who opted into SMS; private note and address edits do not send messages.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-[#d3cec5]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#d6b779] px-6 py-3 text-sm font-bold text-[#101010] disabled:opacity-50">{saving ? "Saving changes…" : "Save booking changes"}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
