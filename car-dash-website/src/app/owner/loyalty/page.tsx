"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { loyaltyTotals, type LoyaltyCard } from "@/lib/loyalty";

const field = "mt-2 w-full rounded-xl border border-white/20 bg-[#111] px-4 py-3 text-white outline-none focus:border-[#d6b779]";
const button = "rounded-full border border-white/20 px-5 py-3 text-sm disabled:opacity-40";
const gold = "rounded-full bg-[#d6b779] px-5 py-3 text-sm font-semibold text-[#111] disabled:opacity-40";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
type Mode = "create" | "visit" | "redeem" | "void";

export default function LoyaltyPage() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [target, setTarget] = useState("");
  const [opening, setOpening] = useState("0");
  const [readyOnly, setReadyOnly] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pending = useRef(false);
  const requestId = useRef("");
  const card = cards.find(c => c.id === selected);
  const totals = card ? loyaltyTotals(card) : null;

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/owner/loyalty", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load cards.");
      setCards(data.cards);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load cards."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (mode) formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [mode, target]);
  function begin(next: Mode, targetId = "") {
    setMode(next); setTarget(targetId); setOpening("0"); setError(""); setMessage(""); requestId.current = crypto.randomUUID();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), action: mode, vin: mode === "create" ? form.get("vin") : card?.vin, version: card?.version, targetId: target, requestId: requestId.current, paid: form.get("paid") === "on" };
    try {
      const response = await fetch("/api/owner/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the entry.");
      setCards(old => [data.card, ...old.filter(c => c.id !== data.card.id)]);
      setSelected(data.card.id); setMode(null);
      setMessage(mode === "create" ? "Card created. Write its card ID on the physical card." : mode === "redeem" ? "Free Essential Detail redeemed. Four visits were used; the full history is preserved." : mode === "void" ? "Correction saved. The original entry stays in the history." : "Paid visit recorded. You can punch the physical card now.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save. Try again."); }
    finally { pending.current = false; setBusy(false); }
  }
  const query = search.trim().toLowerCase();
  const matches = cards.filter(c => (!readyOnly || loyaltyTotals(c).rewards > 0) && (!query || [c.customer, c.vehicle, c.vin, c.phone, c.phone.replace(/\D/g, ""), c.id].join(" ").toLowerCase().includes(query)));
  const ready = cards.filter(c => loyaltyTotals(c).rewards > 0).length;

  return <main className="min-h-screen bg-[#111] px-4 py-8 text-[#f4efe5] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="text-xs uppercase tracking-[.2em] text-[#d6b779]">Owner · customer loyalty</p><h1 className="mt-3 font-serif text-4xl">Every visit, verified.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">4 completed, paid details earn 1 free Essential Detail for this vehicle. Check this record before accepting a punched card. Free details do not earn another punch.</p></div>
        <button className={gold} disabled={busy || loading} onClick={() => begin("create")}>New loyalty card</button>
      </div>
      <div className="my-7 flex flex-wrap gap-5 border-y border-white/15 py-5 text-sm"><span><strong className="text-[#d6b779]">{cards.length}</strong> vehicle cards</span><span><strong className="text-[#d6b779]">{ready}</strong> ready for a reward</span><span>Owner-only records · saved across devices</span></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-950/30 p-4 text-red-100">{error} <button className="ml-2 underline" disabled={busy} onClick={() => { setMode(null); void load(); }}>Refresh records</button></p>}
      {message && <p role="status" className="mb-5 rounded-xl border border-[#d6b779]/40 p-4 text-[#d6b779]">{message}</p>}
      {mode && <form key={`${mode}-${target}`} ref={formRef} onSubmit={save} className="mb-8 rounded-2xl border border-[#d6b779]/40 bg-[#1c1c1c] p-5 sm:p-7">
        <h2 className="font-serif text-2xl">{mode === "create" ? "Issue a loyalty card" : mode === "visit" ? "Record a paid detail" : mode === "redeem" ? "Redeem a free Essential Detail" : "Correct a recorded entry"}</h2>
        {mode !== "create" && <p className="mt-2 text-sm text-white/65">{card?.customer} · {card?.vehicle} · VIN ending {card?.vin.slice(-6)}</p>}
        <fieldset disabled={busy} className="mt-5 grid gap-5 sm:grid-cols-2">
          {mode === "create" && <>
            <label className="text-sm">Customer name<input name="customer" autoComplete="name" maxLength={120} required className={field}/></label>
            <label className="text-sm">Phone<input name="phone" type="tel" autoComplete="tel" maxLength={40} required className={field}/></label>
            <label className="text-sm">Vehicle year, make and model<input name="vehicle" placeholder="2026 Tesla Model Y" maxLength={160} required className={field}/></label>
            <label className="text-sm">Full VIN<input name="vin" autoCapitalize="characters" spellCheck={false} pattern="[A-HJ-NPR-Za-hj-npr-z0-9]{17}" minLength={17} maxLength={17} placeholder="17-character VIN" required className={`${field} uppercase`}/></label>
            <label className="text-sm">Already verified paid visits<select name="opening" value={opening} onChange={e => setOpening(e.target.value)} className={field}>{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} visits</option>)}</select></label>
          </>}
          <label className="text-sm">{mode === "create" ? "Card issue date" : mode === "void" ? "Correction date" : "Service date"}<input type="date" name="date" defaultValue={today()} max={today()} required className={field}/></label>
          {mode === "visit" && <label className="text-sm">Service performed<input name="service" placeholder="Full Detail" maxLength={160} required className={field}/></label>}
          {(mode === "visit" || mode === "redeem") && <label className="text-sm">Receipt / booking reference (optional)<input name="reference" maxLength={120} className={field}/></label>}
          <label className="text-sm sm:col-span-2">{mode === "void" ? "Reason for correction (required)" : mode === "create" && opening !== "0" ? "How were the existing visits verified? (required)" : "Notes (optional)"}<textarea name="notes" maxLength={1000} required={mode === "void" || (mode === "create" && opening !== "0")} rows={2} className={field}/></label>
          {mode === "visit" && <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" name="paid" required className="mt-1"/>I verified that this detail was completed and paid. Add one punch.</label>}
          {mode === "redeem" && <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" required className="mt-1"/>I’m providing the free Essential Detail now. Use four verified visits and record this redemption.</label>}
          <div className="flex flex-wrap gap-3 sm:col-span-2"><button className={gold} type="submit">{busy ? "Saving…" : mode === "create" ? "Create card" : mode === "redeem" ? "Confirm redemption" : mode === "void" ? "Save correction" : "Save paid visit"}</button><button className={button} type="button" onClick={() => setMode(null)}>Cancel</button></div>
        </fieldset>
      </form>}
      <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
        <section aria-label="Find loyalty cards">
          <label className="text-sm">Find a customer or vehicle<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, phone, VIN, car or card ID" className={field}/></label>
          <label className="my-4 flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={readyOnly} onChange={e => setReadyOnly(e.target.checked)}/>Show reward-ready cards only</label>
          {loading ? <p role="status" className="py-8">Loading loyalty records…</p> : !matches.length ? <p className="rounded-xl border border-white/15 p-6 text-sm text-white/65">{cards.length ? "No matching cards." : "No loyalty cards yet. Create one for the next customer, or enter verified visits from an existing card."}</p> : <div className="space-y-3">{matches.map(c => { const t = loyaltyTotals(c); return <button disabled={busy} key={c.id} onClick={() => {setSelected(c.id); setMode(null); setMessage("");}} className={`w-full rounded-xl border p-5 text-left ${selected === c.id ? "border-[#d6b779] bg-[#24211b]" : "border-white/15 bg-[#191919]"}`}><span className="block font-semibold">{c.customer}</span><span className="mt-1 block text-sm text-white/65">{c.vehicle}</span><span className="mt-2 block text-xs text-white/50">VIN ending {c.vin.slice(-6)} · {c.phone}</span><span className="mt-3 block text-sm text-[#d6b779]">{t.rewards ? `${t.rewards} free detail${t.rewards > 1 ? "s" : ""} available` : `${t.progress} / 4 verified visits`}</span></button>; })}</div>}
        </section>
        <section aria-label="Loyalty card details" className="min-w-0">
          {card && totals ? <div className="rounded-2xl border border-white/15 bg-[#191919] p-5 sm:p-7">
            <p className="text-xs uppercase tracking-wider text-[#d6b779]">Card {card.id.slice(0,8).toUpperCase()}</p><h2 className="mt-2 font-serif text-3xl">{card.customer}</h2><p className="mt-2 text-white/70">{card.vehicle}</p><p className="mt-2 break-all font-mono text-xs text-white/60">VIN: {card.vin}</p><p className="mt-2 text-sm text-white/60">{card.phone}</p>
            <div className="my-6 flex gap-3" aria-label={`${totals.balance} verified visits remaining`}>{[1,2,3,4].map(n => <span key={n} className={`grid h-11 w-11 place-items-center rounded-full border ${totals.balance >= n ? "border-[#d6b779] bg-[#d6b779] text-black" : "border-white/25 text-white/40"}`}>{n}</span>)}</div>
            <p className="text-lg text-[#d6b779]">{totals.rewards ? `${totals.rewards} free Essential Detail${totals.rewards > 1 ? "s" : ""} ready` : `${4 - totals.progress} more paid detail${4 - totals.progress === 1 ? "" : "s"} until the reward`}</p><p className="mt-2 text-xs text-white/55">{totals.earned} verified paid visits · {totals.redeemed} rewards redeemed · {totals.balance} unused visits</p>
            <div className="my-6 flex flex-wrap gap-3"><button className={gold} disabled={busy} onClick={() => begin("visit")}>Add paid visit</button><button className={button} disabled={busy || !totals.rewards} onClick={() => begin("redeem")}>Redeem reward</button></div>
            <h3 className="border-t border-white/15 pt-6 text-lg">Visit & correction history</h3>
            <ol className="mt-4 space-y-4">{[...card.events].reverse().map(e => { const reversed = card.events.some(v => v.type === "void" && v.targetId === e.id); return <li key={e.id} className="border-b border-white/10 pb-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{e.type === "void" ? "Correction" : e.service}{reversed ? " — reversed" : ""}</strong><span className="text-white/60">{e.date}</span></div><p className="mt-1 text-white/60">{e.type === "opening" ? `${e.credits} verified opening visits` : e.type === "visit" ? "+1 paid visit" : e.type === "redeem" ? "4 visits used · free detail redeemed" : `Reversed entry ${e.targetId?.slice(0,8)}`}</p>{e.reference && <p className="mt-1 break-words">Reference: {e.reference}</p>}{e.notes && <p className="mt-2 whitespace-pre-wrap break-words text-white/75">{e.notes}</p>}<p className="mt-2 break-words text-xs text-white/45">Recorded {new Date(e.recordedAt).toLocaleString()} by {e.actor}</p>{e.type !== "void" && !reversed && e.credits !== 0 && <button disabled={busy} className="mt-2 text-xs text-[#d6b779] underline" onClick={() => begin("void", e.id)}>Correct this entry</button>}</li>; })}</ol>
          </div> : <div className="rounded-2xl border border-dashed border-white/20 p-8 text-sm leading-6 text-white/60">Select a card to verify the punches and view its history. A customer does not need a website account. One record is kept per VIN, even if the paper card is lost or replaced.</div>}
        </section>
      </div>
    </div>
  </main>;
}
