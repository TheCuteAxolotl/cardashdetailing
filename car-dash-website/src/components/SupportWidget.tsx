"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

type SupportMessage = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  messages: SupportMessage[];
};

type Session = { ticketId: string; accessToken: string };

const SESSION_KEY = "carDashSupportSession";

export default function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [content, setContent] = useState({ ...SITE_DEFAULTS });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    contactPreference: "website",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : SITE_DEFAULTS))
      .then((data) => setContent({ ...SITE_DEFAULTS, ...data }))
      .catch(() => undefined);

    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSession(JSON.parse(saved));
    } catch {}
  }, []);

  const loadTicket = async (activeSession = session) => {
    if (!activeSession) return;
    const response = await fetch(
      `/api/support/${activeSession.ticketId}?accessToken=${encodeURIComponent(activeSession.accessToken)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return;
    const data = await response.json();
    setTicket(data.ticket);
  };

  useEffect(() => {
    if (!open || !session) return;
    setLoading(true);
    loadTicket(session).finally(() => setLoading(false));
    const timer = window.setInterval(() => loadTicket(session), 5000);
    return () => window.clearInterval(timer);
  }, [open, session?.ticketId, session?.accessToken]);

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send support request.");
      const nextSession = { ticketId: data.ticket.id, accessToken: data.accessToken };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send support request.");
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/support/${session.ticketId}?accessToken=${encodeURIComponent(session.accessToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: reply }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send message.");
      setReply("");
      await loadTicket(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setTicket(null);
    setError("");
    setReply("");
    setForm({ name: "", email: "", phone: "", contactPreference: "website", subject: "", message: "" });
  };

  const statusLabel = useMemo(() => {
    if (!ticket) return "";
    return ticket.status === "closed" ? "Closed" : ticket.status === "waiting" ? "Team replied" : "Open";
  }, [ticket]);

  if (pathname.startsWith("/owner")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(0,0,0,.35)] transition hover:bg-neutral-200"
      >
        {content.supportButtonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-end bg-black/45 p-0 backdrop-blur-sm sm:p-5">
          <section className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0a0a0a] text-white shadow-2xl sm:w-[440px] sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-400">Support</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">{content.supportTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-white/42">{content.supportIntro}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white">Close</button>
            </div>

            <div className="overflow-y-auto p-5">
              {loading && !ticket ? (
                <p className="text-sm text-white/40">Loading support…</p>
              ) : ticket && session ? (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-white/35">Ticket {ticket.id.slice(-7).toUpperCase()}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">{statusLabel}</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {ticket.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === "owner" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === "owner" ? "bg-white/[0.07] text-white/80" : "bg-red-600 text-white"}`}>
                          <p>{message.body}</p>
                          <p className={`mt-1 text-[10px] ${message.sender === "owner" ? "text-white/30" : "text-white/60"}`}>
                            {message.sender === "owner" ? "Car Dash" : "You"} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {ticket.status !== "closed" ? (
                    <form onSubmit={sendReply} className="mt-5 flex gap-2">
                      <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a message…" className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                      <button disabled={sending || !reply.trim()} className="rounded-full bg-red-600 px-4 py-3 text-sm font-semibold disabled:opacity-40">Send</button>
                    </form>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-white/45">This ticket is closed. Start a new request if anything else comes up.</p>
                  )}

                  {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
                  <button onClick={startNew} className="mt-5 text-xs font-semibold text-white/35 hover:text-white">Start a new request</button>
                </div>
              ) : (
                <form onSubmit={createTicket} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                    <select value={form.contactPreference} onChange={(e) => setForm({ ...form, contactPreference: e.target.value })} className="rounded-2xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white/70 outline-none focus:border-red-500/50">
                      <option value="website">Reply here</option>
                      <option value="email">Email me</option>
                      <option value="phone">Call or text me</option>
                    </select>
                  </div>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What do you need help with?" className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Give the details here…" className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 outline-none focus:border-red-500/50" />
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  <button disabled={sending} className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:opacity-50">{sending ? "Sending…" : "Send to support"}</button>
                  <p className="text-[11px] leading-5 text-white/25">Website chat stays available in this browser. If email or phone is selected, the team can follow up when available.</p>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
