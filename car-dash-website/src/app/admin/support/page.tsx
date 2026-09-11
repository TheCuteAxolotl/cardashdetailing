"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Ticket = { id: string; name: string; email?: string | null; phone?: string | null; contactPreference: string; subject: string; status: string; createdAt: string; updatedAt: string; messages: Message[] };

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");


  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const data = await response.json();
      if (data.user.role === "owner") return window.location.assign("/owner/support");
      if (data.user.role !== "admin") return window.location.assign("/");
    })();
  }, []);

  const load = async () => {
    const response = await fetch("/api/support", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) return window.location.assign("/login");
    if (response.ok) {
      const data = await response.json();
      setTickets(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [selectedId]);

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || null, [tickets, selectedId]);

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setMessage("");
    const response = await fetch(`/api/support/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error || "Could not send reply.");
      return;
    }
    setReply("");
    await load();
  };

  const setStatus = async (status: string) => {
    if (!selected) return;
    const response = await fetch(`/api/support/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error || "Could not update status.");
      return;
    }
    await load();
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">Staff</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Support inbox</h1>
            <p className="mt-2 text-sm text-white/38">Reply to customer support chats and update ticket status.</p>
          </div>
          <a href="/admin/dashboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/65">Back to dashboard</a>
        </div>

        <div className="grid gap-5 py-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-2 rounded-[24px] border border-white/10 bg-white/[.025] p-3">
            {tickets.length ? tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-2xl p-4 text-left transition ${selectedId === ticket.id ? "bg-white text-black" : "hover:bg-white/5"}`}>
                <div className="flex justify-between gap-3"><span className="font-semibold">{ticket.name}</span><span className={`text-[10px] uppercase ${selectedId === ticket.id ? "text-black/45" : "text-white/30"}`}>{ticket.status}</span></div>
                <p className={`mt-1 truncate text-sm ${selectedId === ticket.id ? "text-black/55" : "text-white/38"}`}>{ticket.subject}</p>
              </button>
            )) : <p className="p-5 text-sm text-white/35">No support requests yet.</p>}
          </aside>

          <section className="min-h-[620px] rounded-[24px] border border-white/10 bg-white/[.025] p-5 sm:p-7">
            {selected ? <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
                <div><h2 className="text-2xl font-semibold">{selected.subject}</h2><p className="mt-2 text-sm text-white/42">{selected.name} · {selected.contactPreference}{selected.email ? ` · ${selected.email}` : ""}{selected.phone ? ` · ${selected.phone}` : ""}</p></div>
                <div className="flex gap-2">{["open","waiting","closed"].map((status) => <button key={status} onClick={() => setStatus(status)} className={`rounded-full px-3 py-2 text-xs capitalize ${selected.status === status ? "bg-[#FF2D2D] text-[#0D0D0D]" : "border border-white/10 text-white/50"}`}>{status}</button>)}</div>
              </div>
              <div className="space-y-3 py-6">{selected.messages.map((item) => <div key={item.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.sender === "team" ? "ml-auto bg-[#FF2D2D] text-[#0D0D0D]" : "bg-white/7 text-white/75"}`}>{item.body}</div>)}</div>
              <form onSubmit={sendReply} className="mt-auto flex gap-2 border-t border-white/8 pt-5"><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to customer…" className="support-input"/><button className="rounded-full bg-white px-5 text-sm font-semibold text-black">Send</button></form>
            </> : <div className="grid h-full place-items-center text-white/30">Choose a conversation.</div>}
          </section>
        </div>
        {message && <p className="rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-white/65">{message}</p>}
      </div>
    </main>
  );
}
