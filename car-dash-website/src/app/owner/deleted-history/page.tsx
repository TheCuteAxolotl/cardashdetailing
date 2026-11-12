"use client";
import { useEffect, useMemo, useState } from "react";

type DeletedItem = {
  id: string;
  kind: "invoice" | "inventory" | "team";
  entityId: string;
  summary: string;
  scope: string;
  deletedAt: string;
  deletedById: string;
  deletedByName: string;
  restoredAt: string | null;
  restoredByName: string | null;
};
const date = (iso: string) => new Date(iso).toLocaleString("en-US", {
  timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short",
});

export default function DeletedHistoryPage() {
  const [history, setHistory] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/deleted-items", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not load deleted history.");
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load history.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  const shown = useMemo(() => history.filter((item) => filter === "all"
    || (filter === "active" ? !item.restoredAt : filter === "restored" ? Boolean(item.restoredAt) : item.kind === filter)),
  [history, filter]);

  async function restore(item: DeletedItem) {
    if (restoring || !window.confirm("Restore " + item.summary + " to its original workspace?")) return;
    setRestoring(item.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/owner/deleted-items", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(result.error || "Restore failed.");
      setMessage(item.summary + " restored. Its original record is available again.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore record.");
    } finally { setRestoring(""); }
  }

  return <main className="min-h-screen bg-[#141413] p-4 pb-24 text-[#f3ece1] sm:p-7">
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Owner audit</p>
          <h1 className="mt-2 text-3xl font-semibold">Deleted history</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#b7ad9f]">
            Review who deleted invoices, supply items, and teams. Restore the exact archived record.
            This history remains visible even after an item is restored.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-40">Refresh</button>
      </header>
      <section className="flex flex-wrap gap-2">
        {[["all","All"],["active","Not restored"],["restored","Restored"],["invoice","Invoices"],["inventory","Supplies"],["team","Teams"]].map(([key, label]) =>
          <button key={key} onClick={() => setFilter(key)}
            className={"rounded-full px-4 py-2 text-xs font-semibold " + (filter === key ? "bg-[#d6b779] text-[#181818]" : "border border-white/20 text-white/70")}>
            {label}</button>)}
      </section>
      {message && <p role="status" className="rounded-xl border border-[#d6b779]/30 p-3 text-sm text-[#e8d1a2]">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#211f1e]">
        {loading ? <p className="p-6 text-sm text-white/55">Loading deleted history…</p>
          : !shown.length ? <p className="p-6 text-sm text-white/55">No deleted records match this view.</p>
          : <div className="divide-y divide-white/10">
              {shown.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#d6b779]">{item.kind}</p>
                  <p className="break-words text-sm font-semibold">{item.summary}</p>
                  <p className="text-xs text-white/55">
                    Deleted by {item.deletedByName || "Unknown"} · {date(item.deletedAt)}
                  </p>
                  {item.kind === "inventory" && <p className="text-xs text-white/55">Original inventory: {item.scope === "owner" ? "Owner" : "Assigned detailer"}</p>}
                  {item.restoredAt && <p className="text-xs text-emerald-300">
                    Restored by {item.restoredByName || "Owner"} · {date(item.restoredAt)}
                  </p>}
                </div>
                {item.restoredAt ? <span className="rounded-xl border border-emerald-300/25 px-3 py-2 text-xs text-emerald-200">Restored</span>
                  : <button type="button" disabled={Boolean(restoring)} onClick={() => void restore(item)}
                      className="rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-semibold text-[#171717] disabled:opacity-40">
                      {restoring === item.id ? "Restoring…" : "Restore"}
                    </button>}
              </article>)}
            </div>}
      </section>
      <p className="text-xs text-white/45">Currently tracks invoice deletions, supply removals, and deleted teams from this update onward. Earlier permanent deletions cannot be recovered automatically.</p>
    </div>
  </main>;
}
