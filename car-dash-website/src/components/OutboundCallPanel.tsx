"use client";

import { FormEvent, useState } from "react";

export default function OutboundCallPanel() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function startCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/voice/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not start the call.");
      setMessage(payload.message || "Your phone is ringing. Answer it and press 1 to connect.");
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "Could not start the call.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
      <h2 className="text-xl font-semibold">Call a customer</h2>
      <p className="mt-1 text-sm text-white/45">
        Enter their number. Your phone rings first; press 1, then the customer receives the call from your Car Dash number.
      </p>
      <form onSubmit={startCall} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="Customer phone number"
          required
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#6EAEC6]/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-[#0B1822] disabled:opacity-50"
        >
          {busy ? "Starting call…" : "Call from Car Dash"}
        </button>
      </form>
      {message && <p role="status" className="mt-3 text-sm text-emerald-300">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}
