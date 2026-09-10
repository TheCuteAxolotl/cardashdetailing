"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Ticket = { id: string; name: string; email?: string | null; phone?: string | null; contactPreference: string; subject: string; status: string; createdAt: string; updatedAt: string; messages: Message[] };

export default function OwnerSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [reply, setReply] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch("/api/support", { cache: "no-store" });
    if (response.status === 403) { window.location.assign("/login"); return; }
    if (response.ok) {
      const data = await response.json(); setTickets(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    }
  };
  useEffect(() => { load(); const t = window.setInterval(load, 3500); return () => window.clearInterval(t); }, [selectedId]);
  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) || null, [tickets, selectedId]);

  const sendReply = async (e: FormEvent) => { e.preventDefault(); if (!selected || !reply.trim()) return; await fetch(`/api/support/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: reply }) }); setReply(""); await load(); };
  const setStatus = async (status: string) => { if (!selected) return; await fetch(`/api/support/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); await load(); };
  const block = async (e: FormEvent) => { e.preventDefault(); setMessage(""); const response = await fetch("/api/support/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, reason }) }); const data = await response.json(); setMessage(data.message || data.error || "Done"); if (response.ok) { setIdentifier(""); setReason(""); } };

  return <main className="min-h-screen bg-[#080808] text-white">
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-red-400">Owner</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Support inbox</h1><p className="mt-2 text-sm text-white/38">Reply to website support chats and block repeat spam using the identifier from Discord.</p></div><a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/65">Back to dashboard</a></div>
      <div className="grid gap-5 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-2 rounded-[24px] border border-white/10 bg-white/[.025] p-3">{tickets.length ? tickets.map((t) => <button key={t.id} onClick={() => setSelectedId(t.id)} className={`w-full rounded-2xl p-4 text-left transition ${selectedId === t.id ? "bg-white text-black" : "hover:bg-white/5"}`}><div className="flex justify-between gap-3"><span className="font-semibold">{t.name}</span><span className={`text-[10px] uppercase ${selectedId === t.id ? "text-black/45" : "text-white/30"}`}>{t.status}</span></div><p className={`mt-1 truncate text-sm ${selectedId === t.id ? "text-black/55" : "text-white/38"}`}>{t.subject}</p></button>) : <p className="p-5 text-sm text-white/35">No support requests yet.</p>}</aside>
        <section className="min-h-[620px] rounded-[24px] border border-white/10 bg-white/[.025] p-5 sm:p-7">{selected ? <><div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5"><div><h2 className="text-2xl font-semibold">{selected.subject}</h2><p className="mt-2 text-sm text-white/42">{selected.name} · {selected.contactPreference}{selected.email ? ` · ${selected.email}` : ""}{selected.phone ? ` · ${selected.phone}` : ""}</p></div><div className="flex gap-2">{["open","waiting","closed"].map((s)=><button key={s} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-2 text-xs capitalize ${selected.status===s?"bg-red-600":"border border-white/10 text-white/50"}`}>{s}</button>)}</div></div><div className="space-y-3 py-6">{selected.messages.map((m)=><div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.sender==="team"?"ml-auto bg-red-600":"bg-white/7 text-white/75"}`}>{m.body}</div>)}</div><form onSubmit={sendReply} className="mt-auto flex gap-2 border-t border-white/8 pt-5"><input value={reply} onChange={(e)=>setReply(e.target.value)} placeholder="Reply to customer…" className="support-input"/><button className="rounded-full bg-white px-5 text-sm font-semibold text-black">Send</button></form></> : <div className="grid h-full place-items-center text-white/30">Choose a conversation.</div>}</section>
      </div>
      <section className="rounded-[24px] border border-red-500/20 bg-red-500/[.04] p-6"><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-red-400">Spam controls</p><h2 className="mt-2 text-2xl font-semibold">Block a visitor</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">Paste the IP address or visitor hash shown in the Discord support alert. The website does not display those identifiers anywhere.</p><form onSubmit={block} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="IP or visitor hash from Discord" className="support-input" required/><input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason (optional)" className="support-input"/><button className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold">Block</button></form>{message&&<p className="mt-3 text-sm text-white/55">{message}</p>}</section>
    </div>
  </main>;
}
