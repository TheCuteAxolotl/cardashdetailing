"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Ticket = { id: string; name: string; subject: string; status: string; messages: Message[] };
type Session = { id: string; key: string };

const STORAGE = "car-dash-support-session";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadTicket = async (active: Session) => {
    const response = await fetch(`/api/support/${active.id}`, { cache: "no-store", headers: { "x-support-key": active.key } });
    if (!response.ok) return;
    setTicket(await response.json());
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        const parsed = JSON.parse(saved) as Session;
        setSession(parsed);
        loadTicket(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!open || !session) return;
    const timer = window.setInterval(() => loadTicket(session), 3500);
    return () => window.clearInterval(timer);
  }, [open, session]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length, open]);

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send support request.");
      const active = { id: data.ticket.id, key: data.accessKey };
      localStorage.setItem(STORAGE, JSON.stringify(active));
      setSession(active);
      await loadTicket(active);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send support request."); }
    finally { setSending(false); }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !message.trim()) return;
    setSending(true); setError("");
    try {
      const response = await fetch(`/api/support/${session.id}`, { method: "POST", headers: { "Content-Type": "application/json", "x-support-key": session.key }, body: JSON.stringify({ message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Message failed.");
      setMessage("");
      await loadTicket(session);
    } catch (e) { setError(e instanceof Error ? e.message : "Message failed."); }
    finally { setSending(false); }
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE);
    setSession(null); setTicket(null); setError("");
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[70] rounded-full border border-black/10 bg-[#f3f0e8] px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5">
        Need help?
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-end bg-black/35 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.currentTarget === e.target) setOpen(false); }}>
          <section className="flex max-h-[82vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] text-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-5">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.26em] text-red-400">Car Dash Support</p><h2 className="mt-2 text-xl font-semibold">What do you need help with?</h2></div>
              <button onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white">Close</button>
            </div>
            {!session ? (
              <form onSubmit={createTicket} className="space-y-4 overflow-y-auto p-5">
                <input name="name" required placeholder="Name" className="support-input" />
                <input name="subject" required placeholder="What is this about?" className="support-input" />
                <textarea name="message" required rows={5} placeholder="Tell the team what happened or what you need." className="support-input resize-none" />
                <div><label className="mb-2 block text-xs text-white/45">How should Car Dash reply?</label><select name="contactPreference" className="support-input"><option value="website">Website live chat</option><option value="text">Text me later</option><option value="phone">Call me later</option><option value="email">Email me later</option></select></div>
                <input name="phone" placeholder="Phone number (optional)" className="support-input" />
                <input name="email" type="email" placeholder="Email (optional)" className="support-input" />
                {error && <p className="text-sm text-red-300">{error}</p>}
                <button disabled={sending} className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-50">{sending ? "Sending…" : "Send to support"}</button>
                <p className="text-xs leading-5 text-white/30">For website chat, keep this browser/device so the conversation stays connected.</p>
              </form>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-white/8 px-5 py-3 text-xs text-white/40">{ticket?.subject || "Support request"} · {ticket?.status || "open"}</div>
                <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-5">
                  {(ticket?.messages || []).map((item) => <div key={item.id} className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.sender === "team" ? "bg-red-600 text-white" : "ml-auto bg-white/8 text-white/80"}`}><p>{item.body}</p><p className="mt-1 text-[10px] opacity-45">{item.sender === "team" ? "Car Dash" : "You"}</p></div>)}
                  <div ref={endRef} />
                </div>
                <form onSubmit={sendMessage} className="border-t border-white/10 p-4"><div className="flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message…" className="support-input" /><button disabled={sending} className="rounded-full bg-white px-4 text-sm font-semibold text-black disabled:opacity-50">Send</button></div>{error && <p className="mt-2 text-xs text-red-300">{error}</p>}<button type="button" onClick={clearSession} className="mt-3 text-xs text-white/30 hover:text-white/60">Start a new support request</button></form>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
