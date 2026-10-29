"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  preferredDate: string | null;
  preferredTime?: string | null;
};

type Preview = {
  customerName: string;
  customerPhone: string;
  message: string;
  recordedConsent: boolean;
  alreadyScheduledOrSent: boolean;
  priorStatus: "sent" | "processing" | null;
};

export default function BookingReminderDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/reminder`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not prepare the appointment reminder.");
        if (!controller.signal.aborted) setPreview(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load reminder.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [booking.id]);

  async function sendNow() {
    if (!preview || sending || preview.alreadyScheduledOrSent) return;
    if (!preview.recordedConsent && !consentConfirmed) {
      setError("Confirm that the customer agreed to receive this reminder by SMS.");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmSend: true,
          confirmSmsPermission: consentConfirmed,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not text the appointment reminder.");
      setSuccess("Reminder SMS submitted! It will appear in the customer's existing message history.");
      setPreview((current) => current ? { ...current, alreadyScheduledOrSent: true, priorStatus: "sent" } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not text the reminder.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="manual-reminder-heading">
      <button type="button" aria-label="Close reminder preview" onClick={onClose} className="fixed inset-0 cursor-default" />
      <section className="relative z-10 my-0 max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#10202A] p-5 text-white shadow-2xl sm:my-6 sm:rounded-3xl sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8BC1D4]">Car Dash · Customer reminder</p>
            <h2 id="manual-reminder-heading" className="mt-2 text-2xl font-bold">Send Reminder Now</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Send one appointment reminder now instead of waiting for the automatic 2-hour text.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl border border-white/15 px-3 py-2 text-white/65">✕</button>
        </header>

        <div className="mt-5 rounded-2xl border border-[#6EAEC6]/20 bg-[#6EAEC6]/5 p-4 text-sm">
          <p className="font-semibold text-[#B9E0EC]">{booking.customerName}</p>
          <p className="mt-1 text-white/65">{booking.customerPhone}</p>
          <p className="mt-2 text-white/75">{booking.serviceName}</p>
          <p className="mt-1 text-white/55">{booking.preferredDate || "Date missing"} · {booking.preferredTime || "Time missing"}</p>
        </div>

        {loading && <p className="mt-5 text-sm text-white/60">Preparing your SMS preview…</p>}
        {preview && (
          <>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-white/45">Customer text preview</p>
              <div className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-[#07131B] p-4 text-sm leading-6 text-[#E3EDF2]">
                {preview.message}
                {"\n"}Reply STOP to opt out or HELP for help.
              </div>
            </div>

            {preview.alreadyScheduledOrSent ? (
              <div role="status" className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                {preview.priorStatus === "sent"
                  ? "A reminder has already been sent for this appointment. No duplicate SMS will be sent."
                  : "A reminder is already being processed for this appointment. No duplicate SMS will be sent."}
              </div>
            ) : (
              <>
                {!preview.recordedConsent && (
                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-white/80">
                    <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#6EAEC6]" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} />
                    <span><strong className="text-amber-100">SMS consent not recorded.</strong> I confirm this customer has agreed to receive this appointment reminder by text. This approval is for this one message only.</span>
                  </label>
                )}
                <p className="mt-4 text-xs leading-5 text-white/45">
                  Sending now replaces the automatic 2-hour reminder for this appointment, so the customer won’t receive two reminders for the same booking.
                </p>
              </>
            )}
          </>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {preview && !preview.alreadyScheduledOrSent && (
            <button type="button" disabled={sending || (!preview.recordedConsent && !consentConfirmed)} onClick={sendNow}
              className="rounded-xl bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-[#07131B] disabled:opacity-40">
              {sending ? "Sending reminder…" : "Confirm & Send SMS Now"}
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/65">{success ? "Done" : "Close"}</button>
          {success && <a href={`/owner/messages?phone=${encodeURIComponent(booking.customerPhone)}`} className="self-center text-sm font-semibold text-[#B9E0EC] underline">Open customer messages</a>}
        </div>
      </section>
    </div>
  );
}
