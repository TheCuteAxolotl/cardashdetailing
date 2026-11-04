"use client";
import { useState, type FormEvent } from "react";
type Result = { number: string; serviceDate: string | null; vehicle: string; services: string[] };
export default function ServiceLookup() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function lookup(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/service-lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to look up service.");
      setResult(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-white">
    <a href="/" className="text-sm text-[#d6b779]">CAR DASH DETAILING</a>
    <p className="mt-16 text-xs uppercase tracking-[.25em] text-[#d6b779]">Service verification</p>
    <h1 className="mt-4 text-4xl font-semibold">Look up your detail</h1>
    <p className="mt-5 leading-7 text-white/65">Enter the booking / invoice number on your certificate or receipt to verify your completed service. Both use the same number.</p>
    <form onSubmit={lookup} className="mt-8 space-y-4">
      <label htmlFor="booking-number" className="block text-sm font-semibold">Booking / invoice number</label>
      <input id="booking-number" value={number} onChange={event => setNumber(event.target.value)} required maxLength={80} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="CD-…" className="w-full rounded-xl border border-[#d6b779]/40 bg-white/5 px-4 py-4 font-mono text-white" />
      <button disabled={busy} className="rounded-xl bg-[#d6b779] px-6 py-4 font-semibold text-[#171411] disabled:opacity-50">{busy ? "Looking up…" : "Verify service"}</button>
    </form>
    {error && <p role="alert" className="mt-6 text-amber-200">{error}</p>}
    <div aria-live="polite">{result && <section className="mt-10 rounded-2xl border border-[#d6b779]/40 bg-white/5 p-6">
      <p className="text-sm font-semibold text-[#d6b779]">Verified · Service completed</p>
      <h2 className="mt-4 text-2xl">{result.vehicle || "Vehicle detail"}</h2>
      <p className="mt-3 break-all font-mono text-sm">{result.number}</p>
      <p className="mt-3">Service date: {result.serviceDate || "Not recorded"}</p>
      <h3 className="mt-6 font-semibold">Services performed</h3>
      <ul className="mt-3 list-disc space-y-3 pl-5 text-white/75">{result.services.map((service, i) => <li key={i}>{service}</li>)}</ul>
    </section>}</div>
    <p className="mt-8 text-sm text-white/60">Need help? <a href="tel:+12243443451" className="text-[#d6b779] underline">224-344-3451</a></p>
  </main>;
}
