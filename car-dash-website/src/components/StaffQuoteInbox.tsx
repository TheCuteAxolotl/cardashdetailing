"use client";

import { useEffect, useMemo, useState } from "react";

type Msg = { id: string; sender: string; body: string; attachmentsJson: string | null; createdAt: string };
type Thread = {
  id: string;
  subject: string;
  status: string;
  quotedPrice: number | null;
  quoteNotes: string | null;
  lastCustomerSeenAt: string | null;
  user: { name: string; email: string };
  vehicle: any;
  service: any;
  messages: Msg[];
};

const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#00F2FE]/55";

export default function StaffQuoteInbox({ backHref, canDelete = false }: { backHref: string; canDelete?: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const response = await fetch("/api/quotes", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      location.href = "/login";
      return;
    }
    if (!response.ok) return;

    const data = await response.json();
    setThreads(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
    if (selectedId && !data.some((thread: Thread) => thread.id === selectedId)) {
      setSelectedId(data[0]?.id || "");
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [selectedId]);

  const active = useMemo(() => threads.find((thread) => thread.id === selectedId) || null, [threads, selectedId]);
  const readOnly = Boolean(active && ["closed", "booked"].includes(active.status));

  useEffect(() => {
    if (active) {
      setPrice(active.quotedPrice == null ? "" : String(active.quotedPrice));
      setNotes(active.quoteNotes || "");
      setMsg("");
    }
  }, [active?.id]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || !reply.trim() || readOnly) return;

    const response = await fetch(`/api/quotes/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Could not send reply.");
      return;
    }

    setReply("");
    await load();
  };

  const saveQuote = async () => {
    if (!active) return;
    const response = await fetch(`/api/quotes/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotedPrice: price, quoteNotes: notes }),
    });
    const data = await response.json().catch(() => ({}));
    setMsg(response.ok ? "Final quote sent." : data.error || "Could not save quote.");
    if (response.ok) await load();
  };

  const setConversation = async (action: "close" | "reopen") => {
    if (!active) return;
    const response = await fetch(`/api/quotes/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await response.json().catch(() => ({}));
    setMsg(response.ok ? (action === "close" ? "Conversation closed." : "Conversation reopened.") : data.error || "Could not update conversation.");
    if (response.ok) await load();
  };

  const deleteChat = async () => {
    if (!active || !canDelete) return;
    const okay = window.confirm(`Permanently delete this quote chat with ${active.user.name}? This cannot be undone.`);
    if (!okay) return;

    setDeleting(true);
    setMsg("");
    try {
      const response = await fetch(`/api/quotes/${active.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMsg(data.error || "Could not delete quote chat.");
        return;
      }
      setSelectedId("");
      setMsg("Quote chat deleted permanently.");
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-8 text-white">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-[#00F2FE]">Sales inbox</p>
            <h1 className="mt-2 text-4xl font-semibold">Specialist quote chats</h1>
            <p className="mt-2 text-white/40">Reply, send exact quotes, close conversations, and follow accepted quotes into bookings.</p>
          </div>
          <a href={backHref} className="h-fit rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-[26px] border border-white/10 bg-white/[.025] p-3">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                className={`mb-2 w-full rounded-2xl p-4 text-left ${thread.id === selectedId ? "bg-white text-black" : "hover:bg-white/5"}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{thread.user.name}</span>
                  <span className="text-[10px] uppercase opacity-50">{thread.status}</span>
                </div>
                <p className="mt-1 truncate text-sm opacity-55">{thread.subject}</p>
                {thread.quotedPrice && <p className="mt-1 text-xs font-semibold opacity-70">${thread.quotedPrice.toFixed(2)}</p>}
              </button>
            ))}
            {!threads.length && <p className="p-5 text-sm text-white/35">No quote chats yet.</p>}
          </aside>

          <section className="min-h-[690px] rounded-[26px] border border-white/10 bg-white/[.025] p-5">
            {active ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                <div>
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold">{active.subject}</h2>
                        <p className="mt-1 text-sm text-white/40">
                          {active.user.name} · {active.user.email}
                          {active.vehicle ? ` · ${active.vehicle.year} ${active.vehicle.make} ${active.vehicle.model}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-white/25">
                          Customer presence: {active.lastCustomerSeenAt && Date.now() - new Date(active.lastCustomerSeenAt).getTime() < 90000 ? "currently/recently active" : "offline"}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase text-white/50">{active.status}</span>
                    </div>

                    {active.status === "accepted" && active.quotedPrice && (
                      <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-4 text-sm text-emerald-200">
                        Customer accepted ${active.quotedPrice.toFixed(2)}. Their chat now shows a Book Now button with this exact total.
                      </p>
                    )}
                    {active.status === "booked" && (
                      <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-4 text-sm text-emerald-200">
                        This accepted quote has been converted into a booking. Manage it from Bookings.
                      </p>
                    )}
                    {active.status === "closed" && (
                      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/50">
                        Closed. The customer can read the history but cannot send new messages.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 py-5">
                    {active.messages.map((message) => {
                      if (message.sender === "system") {
                        return <p key={message.id} className="text-center text-[10px] uppercase tracking-[.16em] text-white/20">{message.body}</p>;
                      }
                      return (
                        <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender === "team" ? "ml-auto bg-[#00F2FE] text-[#0D0D0D]" : "bg-white/8"}`}>
                          <p className="text-sm leading-6">{message.body}</p>
                          {message.attachmentsJson && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {JSON.parse(message.attachmentsJson).map((src: string, index: number) => (
                                <img key={index} src={src} alt="Customer upload" className="max-h-56 w-full rounded-xl object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {readOnly ? (
                    <div className="border-t border-white/10 pt-4 text-sm text-white/35">
                      {active.status === "booked" ? "Booked conversations are locked." : "Reopen the conversation before sending another message."}
                    </div>
                  ) : (
                    <form onSubmit={send} className="flex gap-2 border-t border-white/10 pt-4">
                      <input className={input} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to customer…" />
                      <button className="rounded-full bg-[#00F2FE] px-5 text-[#0D0D0D]">Send</button>
                    </form>
                  )}
                </div>

                <aside className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[.22em] text-[#00F2FE]">Final quote</p>
                  <label className="mt-4 block text-xs text-white/45">
                    Exact price
                    <input type="number" min="1" step="0.01" className={`${input} mt-2`} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="275" />
                  </label>
                  <label className="mt-4 block text-xs text-white/45">
                    Quote notes
                    <textarea className={`${input} mt-2 min-h-28`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Full interior + exterior detail…" />
                  </label>

                  <button
                    onClick={saveQuote}
                    disabled={active.status === "closed" || active.status === "booked"}
                    className="mt-4 w-full rounded-full bg-[#00F2FE] px-5 py-3 font-semibold text-[#0D0D0D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {active.status === "accepted" ? "Send revised quote" : "Send / update quote"}
                  </button>

                  {active.status === "closed" ? (
                    <button onClick={() => setConversation("reopen")} className="mt-2 w-full rounded-full border border-white/15 px-5 py-3 text-sm">
                      Reopen conversation
                    </button>
                  ) : active.status !== "booked" ? (
                    <button onClick={() => setConversation("close")} className="mt-2 w-full rounded-full border border-white/15 px-5 py-3 text-sm">
                      Close conversation
                    </button>
                  ) : null}

                  {canDelete && (
                    <button
                      onClick={deleteChat}
                      disabled={deleting}
                      className="mt-5 w-full rounded-full border border-red-500/35 bg-red-950/20 px-5 py-3 text-sm font-semibold text-red-300 disabled:opacity-40"
                    >
                      {deleting ? "Deleting…" : "Delete quote chat permanently"}
                    </button>
                  )}

                  {msg && <p className="mt-3 text-xs leading-5 text-white/45">{msg}</p>}
                </aside>
              </div>
            ) : (
              <div className="grid min-h-[600px] place-items-center text-white/30">Choose a conversation.</div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
