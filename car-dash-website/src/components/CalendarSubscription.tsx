"use client";

import { useState } from "react";

export default function CalendarSubscription() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(revoke = false) {
    const prompt = revoke
      ? "Disconnect all existing calendar subscriptions?"
      : "Create a private calendar link? Any previous link will stop working.";
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/owner/calendar", { method: revoke ? "DELETE" : "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update calendar link");
      setUrl(result.url || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update calendar link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="my-4 rounded-xl border border-white/10 bg-[#222222] p-5 text-[#f4efe5]">
      <h3 className="text-base font-semibold">Apple Calendar subscription</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b9b5ad]">
        Subscribe to confirmed bookings. Updates refresh on Apple's schedule; private plans and to-dos stay on Car Dash.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => change()} className="rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-semibold text-[#101010] disabled:opacity-50">
          {busy ? "Working…" : "Create private subscription link"}
        </button>
        <button type="button" disabled={busy} onClick={() => change(true)} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-[#cec8bf] hover:border-[#d6b779]/50 disabled:opacity-50">
          Disconnect
        </button>
      </div>
      {url && (
        <div className="mt-4 rounded-xl border border-[#d6b779]/25 bg-[#29261f] p-4">
          <a href={url.replace(/^https?:/, "webcal:")} className="text-sm font-semibold text-[#e5c995] underline">Open in Apple Calendar</a>
          <label className="mt-3 block text-xs text-[#cec8bf]">Or copy into Calendar → Add Calendar → Add Subscription Calendar
            <input readOnly value={url} onFocus={event => event.target.select()} className="mt-2 w-full rounded-xl border border-white/15 bg-[#191919] p-3 text-sm text-[#f4efe5]" />
          </label>
          <p className="mt-2 text-xs leading-5 text-[#aaa49b]">Keep this URL private. It grants access to your appointment names and times and is shown only now.</p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
    </section>
  );
}
