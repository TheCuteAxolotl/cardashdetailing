"use client";
import { useState } from "react";
export default function BookingCertificateButton({ booking }: { booking: { id: string; status: string; bookingNumber?: string } }) {
  const [copied, setCopied] = useState(false);
  async function copyNumber() {
    if (!booking.bookingNumber) return;
    try { await navigator.clipboard.writeText(booking.bookingNumber); setCopied(true); }
    catch { window.prompt("Copy booking / invoice number:", booking.bookingNumber); }
  }
  return <div className="space-y-2">
    {booking.bookingNumber && <p className="break-all text-xs text-[#d6b779]">Booking / invoice: {booking.bookingNumber} <button type="button" onClick={copyNumber} className="ml-2 underline" aria-label="Copy booking and invoice number">{copied ? "Copied" : "Copy"}</button></p>}
    {booking.status !== "cancelled" ? <a href={`/api/bookings/${encodeURIComponent(booking.id)}/certificate`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[#d6b779]/40 bg-[#d6b779]/10 px-4 py-3 text-center text-sm font-semibold text-[#d6b779]">Print certificate</a> : <button disabled title="Certificates are unavailable for canceled bookings" className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm text-white/45">Certificate · Booking canceled</button>}
  </div>;
}
