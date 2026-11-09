"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  phoneNumber: string | null | undefined;
  customerName?: string;
  label?: string;
  className?: string;
};

function isSupportedCustomerNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/** Uses the authenticated Twilio click-to-call bridge, never the device's personal dialer. */
export default function BusinessCallButton({
  phoneNumber,
  customerName,
  label = "Call from Car Dash",
  className = "",
}: Props) {
  const titleId = useId();
  const phone = (phoneNumber || "").trim();
  const supported = isSupportedCustomerNumber(phone);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy]);

  async function startCall() {
    if (!supported || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/voice/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not start the call.");
      setSuccess(result.message || "Your forwarding phone is ringing. Answer and press 1 to connect.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the call.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={!supported}
        onClick={() => { setError(""); setSuccess(""); setOpen(true); }}
        className={className || "inline-flex min-h-10 items-center justify-center rounded-xl border border-[#d6b779]/50 px-4 py-2 text-sm font-semibold text-[#e8d2a1] disabled:cursor-not-allowed disabled:opacity-40"}
        title={supported ? "Call using the Car Dash business number" : "A valid US or Canadian customer number is required"}
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-[#d6b779]/35 bg-[#1c1b19] p-5 text-[#f4efe5] shadow-2xl sm:p-6"
          >
            <h2 id={titleId} className="text-xl font-semibold">Call from Car Dash</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Call {customerName || "this customer"} at <strong className="break-all text-white">{phone}</strong>.
              Your forwarding phone rings first. Answer it and press 1, then the customer receives
              a call showing your Car Dash business number, not your personal number.
            </p>
            {success && <p role="status" className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
                {success ? "Done" : "Cancel"}
              </button>
              {!success && <button type="button" disabled={busy} onClick={() => void startCall()} className="rounded-xl bg-[#d6b779] px-4 py-2.5 text-sm font-bold text-[#191713] disabled:opacity-50">
                {busy ? "Starting call…" : "Start call"}
              </button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
