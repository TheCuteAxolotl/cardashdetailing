"use client";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import SendPhotos from "@/components/SendPhotos";
import SmsAttachments from "@/components/SmsAttachments";
import MessagePhotoGallery from "@/components/MessagePhotoGallery";
import DeleteMessageButton from "@/components/DeleteMessageButton";
import MessageBookingForm from "@/components/MessageBookingForm";
import { DELETED_MESSAGE } from "@/lib/deleted-message";

type Conversation = { kind: "quote" | "booking" | "sms"; id: string; name: string; phone: string; subject: string; status: string; body: string; updatedAt: string };
type Message = { id: string; originalId?: string; source?: "sms" | "booking" | "quote"; sourceId?: string; context?: string; sender: string; body: string; attachmentsJson?: string | null; externalSid?: string | null; createdAt: string };
type Inbox = { conversations: Conversation[]; owner: boolean; canSms: boolean; canBook: boolean };
const field = "w-full rounded-xl border border-white/20 bg-[#202020] px-4 py-3 text-[#f4efe5]";
const button = "rounded-xl border border-[#d6b779]/50 px-4 py-2 text-sm font-semibold disabled:opacity-50";
const keyOf = (row: Conversation) => `${row.kind}:${row.id}`;

function ConversationView({ conversation, owner, canBook, role, onChanged, onBack }: { conversation: Conversation; owner: boolean; canBook: boolean; role: "owner" | "admin"; onChanged: () => void; onBack: () => void }) {
  const historyRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState(conversation.status);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { kind, id } = conversation;
  const readUrl = kind === "sms" ? `/api/messages/direct?phone=${encodeURIComponent(id)}` : kind === "quote" ? `/api/quotes/${id}` : `/api/bookings/${id}/chat`;
  const sendUrl = kind === "sms" ? "/api/sms/unmatched/reply" : readUrl;
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(readUrl, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load conversation.");
      setMessages(data.messages || []);
      setStatus(data.status || data.booking?.status || "");
      setError("");
    } catch (error) { if (!signal?.aborted) setError(error instanceof Error ? error.message : "Could not load conversation."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [readUrl]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => { if (!document.hidden) void load(controller.signal); }, 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load]);
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const history = historyRef.current;
    if (history && followLatest.current) history.scrollTop = history.scrollHeight;
  }, [lastMessageId, loading]);
  function refresh() { void load(); onChanged(); }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(sendUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: draft, ...(kind === "sms" ? { phone: id } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send message.");
      followLatest.current = true; setDraft(""); setNotice(data.warning || "Message sent."); refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not send message."); }
    finally { setBusy(false); }
  }
  const sourceMessage = [...messages].reverse().find(message => message.sender === "customer" && message.body !== DELETED_MESSAGE && (kind !== "sms" || !message.source || message.source !== "quote"));
  return <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#191919]" aria-label="Conversation">
    <header className="shrink-0 border-b border-white/15 px-4 py-3">
    <button type="button" onClick={onBack} className="mb-2 text-sm underline lg:hidden">Back to conversations</button>
    <h2 className="truncate text-lg font-semibold">{conversation.name}</h2>
    <p className="mt-1 truncate text-sm text-white/65">{conversation.subject} {status && `· ${status}`}</p>
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      {kind === "quote" && <a className="underline" href={`/${role}/quotes?thread=${encodeURIComponent(id)}`}>Manage quote / booking</a>}
      {kind === "booking" && <a className="underline" href={`/${role}/bookings`}>Manage booking</a>}
      {kind === "sms" && conversation.phone && <span className="text-white/60">{conversation.phone} · Booking, quote and SMS history</span>}
    </div>
    {canBook && sourceMessage && kind !== "quote" && <details className="mt-2 text-sm"><summary className="cursor-pointer">Booking actions</summary><div className="max-h-48 overflow-y-auto"><MessageBookingForm source={{
      type: (sourceMessage.source || kind) === "sms" ? "sms" : "booking-message",
      id: sourceMessage.originalId || sourceMessage.id,
    }} /></div></details>}
    </header>
    <div ref={historyRef} tabIndex={0} aria-label="Message history" onScroll={() => { const node = historyRef.current; if (node) followLatest.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }} onLoadCapture={() => { const node = historyRef.current; if (node && followLatest.current) node.scrollTop = node.scrollHeight; }} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
      {loading && <p role="status">Loading conversation…</p>}
      {!loading && !messages.length && <p className="text-white/60">No messages yet.</p>}
      {messages.map(message => {
        if (message.sender === "system") return <p key={message.id} className="text-center text-xs text-white/50">{message.body}</p>;
        const deleted = message.body === DELETED_MESSAGE;
        let photos: string[] = [];
        try { const stored = JSON.parse(message.attachmentsJson || "[]"); photos = Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : []; } catch { /* Old malformed attachments should not hide the chat. */ }
        return <article key={message.id} className={`max-w-[95%] break-words rounded-2xl p-4 sm:max-w-[85%] ${message.sender === "team" ? "ml-auto border border-[#d6b779]/50 bg-[#29251d]" : "border border-white/10 bg-[#242424]"}`}>
          <p className={`whitespace-pre-wrap text-sm leading-6 ${deleted ? "italic text-white/50" : ""}`}>{message.body}</p>
          {!deleted && <><SmsAttachments sid={message.externalSid} body={message.body} /><MessagePhotoGallery photos={photos} className="mt-3 flex flex-wrap gap-2" thumbnailClassName="max-h-72 max-w-full rounded-lg object-contain" altPrefix="Customer vehicle photo" /></>}
          <p className="mt-2 text-xs text-white/50">{message.sender === "team" ? "Car Dash" : conversation.name} · {new Date(message.createdAt).toLocaleString()}{message.context && kind === "sms" ? ` · ${message.context}` : ""}</p>
          {owner && !deleted && <DeleteMessageButton kind={message.source || kind} id={message.originalId || message.id} onDeleted={refresh} />}
        </article>;
      })}
    </div>
    <footer className="max-h-[45%] shrink-0 overflow-y-auto border-t border-white/15 bg-[#191919] p-3">
    {error && <p role="alert" className="mb-3 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mb-3 text-sm">{notice}</p>}
    {kind === "quote" && status === "closed" ? <p className="text-sm text-white/60">Reopen this conversation from Manage quote to reply.</p> : <>
      <form onSubmit={send} className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm"><span className="sr-only">Message</span><textarea className={`${field} resize-none`} rows={2} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Type a message. Enter adds a new line." /></label><button disabled={busy || !draft.trim()} className={`${button} bg-[#d6b779] text-black`}>{busy ? "Sending…" : "Send"}</button></form>
      <details className="mt-2 text-sm"><summary className="cursor-pointer">Attach photos</summary><SendPhotos endpoint={sendUrl} payload={kind === "sms" ? { phone: id } : undefined} onSent={() => { followLatest.current = true; refresh(); }} /></details>
    </>}
    </footer>
  </section>;
}

export default function UnifiedMessages({ role }: { role: "owner" | "admin" }) {
  const inboxRef = useRef<HTMLElement>(null);
  const deepLinkedRef = useRef(false);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [newText, setNewText] = useState(false);
  const [phone, setPhone] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/messages/inbox", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load messages.");
      setInbox(data); setError("");
    } catch (error) { if (!signal?.aborted) setError(error instanceof Error ? error.message : "Could not load messages."); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => { if (!document.hidden) void load(controller.signal); }, 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load]);
  useEffect(() => {
    if (!inbox || deepLinkedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const requestedPhone = params.get("phone");
    if (!requestedPhone) return;
    const digits = requestedPhone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `+1${digits}`
      : digits.length === 11 && digits.startsWith("1") ? `+${digits}`
      : requestedPhone.startsWith("+") && digits.length >= 8 && digits.length <= 15 ? `+${digits}` : "";
    if (!normalized) {
      setError("The booking does not have a valid phone number for texting.");
      deepLinkedRef.current = true;
      return;
    }
    const found = inbox.conversations.find(row => row.kind === "sms" && row.phone === normalized);
    setSelected(found || {
      kind: "sms", id: normalized, phone: normalized,
      name: params.get("name")?.slice(0, 120) || normalized,
      subject: "Customer conversation", status: "", body: "", updatedAt: new Date().toISOString(),
    });
    deepLinkedRef.current = true;
  }, [inbox]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => {
      const node = inboxRef.current;
      if (!node) return;
      const bottom = viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
      node.style.height = `${Math.max(240, bottom - node.getBoundingClientRect().top)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    return () => { window.removeEventListener("resize", resize); viewport?.removeEventListener("resize", resize); viewport?.removeEventListener("scroll", resize); };
  }, []);
  useEffect(() => {
    if (!inbox?.canSms) return;
    const sync = async () => {
      if (document.hidden) return;
      try { await fetch("/api/sms/sync", { method: "POST" }); await load(); } catch { /* Manual sync reports errors. */ }
    };
    void sync();
    const timer = setInterval(() => void sync(), 30000);
    return () => clearInterval(timer);
  }, [inbox?.canSms, load]);
  const rows = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return (inbox?.conversations || []).filter(row => [row.name, row.phone, row.subject, row.body, row.kind].join(" ").toLowerCase().includes(needle));
  }, [inbox, query]);
  async function sync() {
    setSyncing(true); setNotice("");
    try {
      const response = await fetch("/api/sms/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sync replies.");
      setNotice("Text replies are up to date."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not sync replies."); }
    finally { setSyncing(false); }
  }
  return <main ref={inboxRef} className="h-[calc(100dvh-72px)] overflow-hidden bg-[#101010] p-3 text-[#f4efe5] sm:p-5">
    <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
      <header className={`shrink-0 flex-wrap items-center justify-between gap-3 ${selected ? "hidden lg:flex" : "flex"}`}><div><h1 className="text-2xl font-semibold">Messages</h1><p className="mt-1 hidden text-sm text-white/60 sm:block">One saved conversation per phone, including booking chats, quote chats and direct texts.</p></div>{inbox?.canSms && <div className="flex gap-2"><button className={button} onClick={() => setNewText(!newText)}>New text</button><button className={button} disabled={syncing} onClick={() => void sync()}>{syncing ? "Syncing…" : "Sync replies"}</button></div>}</header>
      {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
      {newText && <form className="mt-5 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); const digits = phone.replace(/\D/g, ""); const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`; if (digits.length < 10 || digits.length > 15) { setError("Enter a valid phone number."); return; } setSelected(inbox?.conversations.find(row => row.kind === "sms" && row.phone === normalized) || { kind: "sms", id: normalized, phone: normalized, name: normalized, subject: "Customer conversation", status: "", body: "", updatedAt: new Date().toISOString() }); setNewText(false); }}><label className="flex-1">Phone number<input type="tel" required className={`${field} mt-2`} value={phone} onChange={event => setPhone(event.target.value)} /></label><button className={`${button} self-end`}>Open conversation</button></form>}
      <div className="mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        <aside className={`min-h-0 min-w-0 flex-col ${selected ? "hidden lg:flex" : "flex"}`}><label className="block shrink-0 pb-3 text-sm">Search conversations<input type="search" className={`${field} mt-2`} value={query} onChange={event => { setQuery(event.target.value); setLimit(50); }} placeholder="Name, phone, quote, or message" /></label>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1" aria-label="Conversations">
          {!inbox && !error && <p role="status">Loading messages…</p>}
          {rows.slice(0, limit).map(row => <button key={keyOf(row)} onClick={() => setSelected(row)} aria-pressed={selected ? keyOf(selected) === keyOf(row) : false} className={`block w-full rounded-xl border p-4 text-left ${selected && keyOf(selected) === keyOf(row) ? "border-[#d6b779] bg-[#29251d]" : "border-white/15 bg-[#191919] hover:border-[#d6b779]/60"}`}><span className="block font-semibold">{row.name}</span><span className="mt-1 block text-xs uppercase text-[#d6b779]">{row.kind === "sms" ? "Customer conversation" : row.kind === "quote" ? "Quote chat" : "Booking chat"} {row.status && `· ${row.status}`}</span><span className="mt-2 block truncate text-sm text-white/70">{row.subject}</span><span className="mt-1 block line-clamp-2 whitespace-pre-wrap text-sm text-white/55">{row.body}</span><time className="mt-2 block text-xs text-white/50">{new Date(row.updatedAt).toLocaleString()}</time></button>)}
          {rows.length > limit && <button className={button} onClick={() => setLimit(value => value + 50)}>Show more conversations</button>}
          {inbox && !rows.length && <p className="text-sm text-white/60">No conversations match.</p>}
          </div>
        </aside>
        <div className={`h-full min-h-0 min-w-0 ${selected ? "block" : "hidden lg:block"}`}>{selected && inbox ? <ConversationView key={keyOf(selected)} conversation={selected} role={role} owner={inbox.owner} canBook={inbox.canBook} onChanged={() => void load()} onBack={() => setSelected(null)} /> : <p className="rounded-2xl border border-white/15 p-8 text-white/60">Choose a conversation to read and reply.</p>}</div>
      </div>
    </div>
  </main>;
}
