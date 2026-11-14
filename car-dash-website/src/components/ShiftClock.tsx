"use client";
import { useEffect, useRef, useState } from "react";

export default function ShiftClock() {
  const [start, setStart] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/jobs/shift", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!controller.signal.aborted) { setStart(data.start); setReady(true); setError(""); }
      }).catch(() => { if (!controller.signal.aborted) setError("Could not load your shift."); });
    return () => controller.abort();
  }, [revision]);

  async function toggle() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/jobs/shift", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: start ? "out" : "in", start }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Could not save shift.");
      setStart(data.start);
      setError("");
    } catch (cause) {
      setReady(false);
      setError(cause instanceof Error ? cause.message : "Refresh your shift to check its status.");
    } finally { lock.current = false; setBusy(false); }
  }
  return <section aria-label="My shift" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-900 p-4 text-white">
    <span role="status">{error || (!ready ? "Loading shift…" : start ? "Clocked in at " + new Date(start).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "Clocked out")}</span>
    <button className="rounded-lg bg-amber-200 px-4 py-2 font-semibold text-black disabled:opacity-60" disabled={busy || (!ready && !error)}
      onClick={() => ready ? void toggle() : setRevision(value => value + 1)}>{busy ? "Saving…" : error ? "Refresh shift" : start ? "Clock out" : "Clock in"}</button>
  </section>;
}
