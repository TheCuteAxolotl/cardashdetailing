"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Ticket = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  contactPreference: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
};
type Block = { id: string; label?: string | null; createdAt: string };

export default function OwnerSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("active");
  const [identifier, setIdentifier] = useState("");
  const [label, setLabel] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    const response = await fetch("/api/support", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setTickets(data.tickets || []);
  };

  const loadBlocks = async () => {
    const response = await fetch("/api/support/block", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setBlocks(data.blocked || []);
  };

  const loadTicket = async (id: string) => {
    const response = await fetch(`/api/support/${id}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setSelected(data.ticket);
  };

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          window.location.assign("/login");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.user?.role !== "owner") window.location.assign("/");
      })
      .catch(() => window.location.assign("/login"));

    loadTickets();
    loadBlocks();
    const timer = window.setInterval(() => {
      loadTickets();
      if (selected?.id) loadTicket(selected.id);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [selected?.id]);

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    const response = await fetch(`/api/support/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    if (!response.ok) return setMessage("Could not send reply.");
    setReply("");
    await loadTicket(selected.id);
    await loadTickets();
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    await fetch(`/api/support/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadTicket(selected.id);
    await loadTickets();
  };

  const blockVisitor = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/support/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, label }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Could not block visitor.");
    setIdentifier("");
    setLabel("");
    setMessage("Visitor blocked. The identifier is not shown in the dashboard.");
    await loadBlocks();
  };

  const removeBlock = async (id: string) => {
    await fetch(`/api/support/block?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadBlocks();
  };

  const visible = tickets.filter((ticket) => filter === "all" || (filter === "active" ? ticket.status !== "closed" : ticket.status === filter));

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <header className="border-b border-white/10 bg-[#090909]">
        <div className="mx-auto flex max-w-[1450px] items-center justify-between px-6 py-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-red-400">Owner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Support Center</h1>
            <p className="mt-1 text-sm text-white/40">Website support chat, follow-ups, and spam control.</p>
          </div>
          <a href="/owner/dashboard" className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/65 hover:text-white">Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-[1450px] px-6 py-8">
        <section className="mb-7 rounded-[26px] border border-white/10 bg-white/[0.025] p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <form onSubmit={blockVisitor}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Spam control</p>
              <h2 className="mt-2 text-xl font-semibold">Block an IP or visitor hash</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">Paste the IP or visitor hash from the Discord support notification. The raw identifier is never displayed back in this dashboard.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_.55fr_auto]">
                <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Paste IP or visitor hash" className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional note" className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500">Block</button>
              </div>
              {message && <p className="mt-3 text-sm text-white/50">{message}</p>}
            </form>
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-sm font-semibold">Blocked visitors: {blocks.length}</p>
              <div className="mt-3 max-h-28 space-y-2 overflow-y-auto">
                {blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between gap-3 text-xs text-white/40">
                    <span>{block.label || "Blocked visitor"} · {new Date(block.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => removeBlock(block.id)} className="text-red-300 hover:text-red-200">Unblock</button>
                  </div>
                ))}
                {!blocks.length && <p className="text-xs text-white/25">No blocked visitors.</p>}
              </div>
            </div>
          </div>
        </section>

        <div className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] lg:grid-cols-[380px_1fr]">
          <aside className="border-b border-white/10 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
              {["active", "open", "waiting", "closed", "all"].map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-white text-black" : "bg-white/[0.05] text-white/45"}`}>{item}</button>
              ))}
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {visible.map((ticket) => (
                <button key={ticket.id} onClick={() => loadTicket(ticket.id)} className={`block w-full border-b border-white/7 p-4 text-left transition hover:bg-white/[0.03] ${selected?.id === ticket.id ? "bg-white/[0.045]" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold">{ticket.subject}</p>
                    <span className="text-[10px] uppercase tracking-wider text-white/25">{ticket.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/38">{ticket.name}</p>
                  <p className="mt-2 text-[10px] text-white/22">{new Date(ticket.updatedAt).toLocaleString()}</p>
                </button>
              ))}
              {!visible.length && <p className="p-5 text-sm text-white/30">No support tickets here.</p>}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col">
            {selected ? (
              <>
                <div className="border-b border-white/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{selected.subject}</h2>
                      <p className="mt-1 text-sm text-white/38">{selected.name} · {selected.email || "No email"} · {selected.phone || "No phone"}</p>
                      <p className="mt-1 text-xs text-white/25">Prefers {selected.contactPreference}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => changeStatus("open")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55">Open</button>
                      <button onClick={() => changeStatus("waiting")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55">Waiting</button>
                      <button onClick={() => changeStatus("closed")} className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold">Close</button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {selected.messages?.map((item) => (
                    <div key={item.id} className={`flex ${item.sender === "owner" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.sender === "owner" ? "bg-red-600" : "bg-white/[0.06] text-white/75"}`}>
                        <p>{item.body}</p>
                        <p className={`mt-1 text-[10px] ${item.sender === "owner" ? "text-white/60" : "text-white/25"}`}>{item.sender === "owner" ? "Car Dash" : selected.name} · {new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendReply} className="flex gap-3 border-t border-white/10 p-4">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the customer…" className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                  <button disabled={!reply.trim()} className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold disabled:opacity-40">Send</button>
                </form>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div><p className="text-lg font-semibold">Pick a support request</p><p className="mt-2 text-sm text-white/35">The chat will open here.</p></div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
