"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type InboxMessage = {
  id: string;
  sender: string;
  body: string;
  channel?: string;
  createdAt: string;
};

type InboxRow = {
  conversationId: string;
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    serviceName: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleTrim: string | null;
    status: string;
    preferredDate: string | null;
    preferredTime: string | null;
  };
  latestMessage: InboxMessage | null;
  unreadCount: number;
  updatedAt: string;
};

type UnmatchedSms = {
  id: string;
  fromPhone: string;
  toPhone: string | null;
  body: string;
  direction?: "inbound" | "outbound";
  externalSid: string;
  createdAt: string;
};

type UnmatchedThread = {
  phone: string;
  messages: UnmatchedSms[];
  latestAt: string;
};

type InboxPayload = {
  conversations: InboxRow[];
  unmatched: UnmatchedSms[];
  totalUnread: number;
};

type SmsConnection = {
  ok?: boolean;
  healthy?: boolean;
  expectedUrl?: string;
  inboundRequestUrl?: string;
  inboundMethod?: string;
  useInboundWebhookOnNumber?: boolean;
  runtimeConfigured?: boolean;
  canRepair?: boolean;
  error?: string;
};

export default function StaffSmsInbox({
  role,
}: {
  role: "owner" | "admin";
}) {
  const [data, setData] = useState<InboxPayload>({ conversations: [], unmatched: [], totalUnread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [connection, setConnection] = useState<SmsConnection | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [syncNote, setSyncNote] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<string | null>(null);
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/sms/inbox", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load messages.");
      setData(payload);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const loadConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/sms/connection", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      setConnection(payload);
    } catch {
      setConnection({ ok: false, error: "Could not check Twilio connection." });
    }
  }, []);

  const syncReplies = useCallback(async (quiet = false) => {
    if (!quiet) setSyncing(true);
    try {
      const response = await fetch("/api/sms/sync", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not sync Twilio replies.");
      if (!quiet) {
        setSyncNote(payload.stored > 0 ? `Imported ${payload.stored} new repl${payload.stored === 1 ? "y" : "ies"}.` : "SMS replies are up to date.");
      }
      await load(true);
    } catch (err) {
      if (!quiet) setSyncNote(err instanceof Error ? err.message : "Could not sync Twilio replies.");
    } finally {
      if (!quiet) setSyncing(false);
    }
  }, [load]);

  const repairConnection = useCallback(async () => {
    setRepairing(true);
    try {
      const response = await fetch("/api/sms/connection", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not repair the SMS connection.");
      setConnection(payload);
      setSyncNote("Twilio incoming replies are now connected to this site.");
      await syncReplies(true);
    } catch (err) {
      setSyncNote(err instanceof Error ? err.message : "Could not repair the SMS connection.");
    } finally {
      setRepairing(false);
    }
  }, [syncReplies]);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const payload = await response.json();
      if (payload.user.role === "owner" && role === "admin") {
        return window.location.assign("/owner/messages");
      }
      if (role === "owner" && payload.user.role !== "owner") return window.location.assign("/admin/dashboard");
      if (role === "admin" && !payload.permissions?.includes("smsInbox")) {
        return window.location.assign(payload.staffAccess ? "/admin/dashboard" : "/dashboard");
      }
      await Promise.all([load(), loadConnection()]);
      await syncReplies(true);
    })();

    const inboxTimer = window.setInterval(() => load(true), 5000);
    const syncTimer = window.setInterval(() => syncReplies(true), 30000);
    const connectionTimer = window.setInterval(() => loadConnection(), 60000);
    return () => {
      window.clearInterval(inboxTimer);
      window.clearInterval(syncTimer);
      window.clearInterval(connectionTimer);
    };
  }, [load, loadConnection, role, syncReplies]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.conversations;
    return data.conversations.filter((row) => {
      const booking = row.booking;
      return [
        booking.customerName,
        booking.customerPhone,
        booking.customerEmail,
        booking.serviceName,
        booking.vehicleYear,
        booking.vehicleMake,
        booking.vehicleModel,
        booking.vehicleTrim || "",
        row.latestMessage?.body || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [data.conversations, query]);

  const unmatchedThreads = useMemo<UnmatchedThread[]>(() => {
    const grouped = new Map<string, UnmatchedSms[]>();

    for (const message of data.unmatched) {
      const outbound = message.direction === "outbound";
      const phone = outbound ? message.toPhone || message.fromPhone : message.fromPhone;
      if (!phone) continue;
      const items = grouped.get(phone) || [];
      items.push(message);
      grouped.set(phone, items);
    }

    const needle = query.trim().toLowerCase();
    return [...grouped.entries()]
      .map(([phone, messages]) => {
        const ordered = [...messages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return {
          phone,
          messages: ordered,
          latestAt: ordered[ordered.length - 1]?.createdAt || new Date(0).toISOString(),
        };
      })
      .filter((thread) => {
        if (!needle) return true;
        return [thread.phone, ...thread.messages.map((message) => message.body)]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  }, [data.unmatched, query]);

  const sendUnmatchedReply = async (phone: string) => {
    const message = String(replyDrafts[phone] || "").trim();
    if (!message || replySending) return;

    setReplySending(phone);
    setReplyNotes((current) => ({ ...current, [phone]: "" }));

    try {
      const response = await fetch("/api/sms/unmatched/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not send text.");

      setReplyDrafts((current) => ({ ...current, [phone]: "" }));
      setReplyNotes((current) => ({ ...current, [phone]: "Sent as SMS." }));
      await load(true);
    } catch (err) {
      setReplyNotes((current) => ({
        ...current,
        [phone]: err instanceof Error ? err.message : "Could not send text.",
      }));
    } finally {
      setReplySending(null);
    }
  };

  const backHref = role === "owner" ? "/owner/dashboard" : "/admin/dashboard";

  return (
    <main className="min-h-screen bg-[#07131B] text-white">
      <header className="border-b border-white/10 bg-[#0B1822]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">SMS Inbox</h1>
              {data.totalUnread > 0 && (
                <span className="rounded-full bg-[#6EAEC6] px-2.5 py-1 text-xs font-bold text-[#0B1822]">
                  {data.totalUnread} unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-white/40">
              Customer text replies are matched to their latest active booking and appear here.
            </p>
          </div>
          <a
            href={backHref}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
          >
            Back
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className={`mb-5 rounded-3xl border p-5 ${connection?.healthy ? "border-emerald-500/25 bg-emerald-500/[.06]" : "border-amber-500/25 bg-amber-500/[.06]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${connection?.healthy ? "bg-emerald-400" : "bg-amber-400"}`} />
                <h2 className="font-semibold">Incoming SMS connection</h2>
              </div>
              <p className="mt-1 text-sm text-white/55">
                {connection?.healthy
                  ? "Twilio is configured to send customer replies directly to this website."
                  : connection?.error || "Incoming webhook is not connected to the site yet. Message-history sync will still try to recover replies."}
              </p>
              {connection?.expectedUrl && (
                <p className="mt-2 break-all text-xs text-white/35">Webhook: {connection.expectedUrl}</p>
              )}
              {syncNote && <p className="mt-2 text-xs text-white/60">{syncNote}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => syncReplies(false)}
                disabled={syncing}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white disabled:opacity-50"
              >
                {syncing ? "Syncing…" : "Sync Replies"}
              </button>
              {!connection?.healthy && connection?.canRepair && (
                <button
                  type="button"
                  onClick={repairConnection}
                  disabled={repairing}
                  className="rounded-full bg-[#6EAEC6] px-4 py-2 text-sm font-bold text-[#0B1822] disabled:opacity-50"
                >
                  {repairing ? "Connecting…" : "Repair SMS Connection"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.025] p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, phone, vehicle, or message…"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#6EAEC6]/60"
          />
        </div>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid min-h-72 place-items-center text-white/40">Loading messages…</div>
        ) : (
          <div className="mt-5 space-y-3">
            {visible.map((row) => {
              const booking = row.booking;
              const vehicle = [
                booking.vehicleYear,
                booking.vehicleMake,
                booking.vehicleModel,
                booking.vehicleTrim,
              ]
                .filter(Boolean)
                .join(" ");
              const latest = row.latestMessage;

              return (
                <a
                  key={row.conversationId}
                  href={`/booking-chat/${booking.id}`}
                  className={`block rounded-3xl border p-5 transition hover:border-[#6EAEC6]/45 ${
                    row.unreadCount > 0
                      ? "border-[#6EAEC6]/35 bg-[#6EAEC6]/[.06]"
                      : "border-white/10 bg-white/[.025]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{booking.customerName}</h2>
                        {row.unreadCount > 0 && (
                          <span className="rounded-full bg-[#6EAEC6] px-2 py-0.5 text-[10px] font-bold text-[#0B1822]">
                            {row.unreadCount} new
                          </span>
                        )}
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/45">
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/35">
                        {booking.customerPhone} · {booking.serviceName} · {vehicle}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
                        {latest ? (
                          <>
                            <span className="font-semibold text-white/50">
                              {latest.sender === "customer" ? booking.customerName : "Car Dash"}:
                            </span>{" "}
                            {latest.body}
                          </>
                        ) : (
                          "No messages yet."
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right text-[11px] text-white/30">
                      {latest && <p>{new Date(latest.createdAt).toLocaleString()}</p>}
                      {latest?.channel === "sms" && (
                        <span className="mt-2 inline-block rounded-full border border-white/10 px-2 py-1 uppercase tracking-[.12em]">
                          SMS
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}

            {!visible.length && (
              <div className="rounded-3xl border border-white/10 bg-white/[.025] p-10 text-center text-white/40">
                {query ? "No messages match that search." : "No customer text conversations yet."}
              </div>
            )}
          </div>
        )}

        {unmatchedThreads.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Direct SMS conversations</h2>
              <p className="mt-1 text-sm text-white/40">
                These numbers aren’t linked to a booking yet. You can still text them directly from Car Dash here.
              </p>
            </div>

            <div className="space-y-4">
              {unmatchedThreads.map((thread) => (
                <article key={thread.phone} className="overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/[.035]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
                    <div>
                      <a href={`tel:${thread.phone}`} className="font-semibold text-white hover:text-[#6EAEC6]">
                        {thread.phone}
                      </a>
                      <p className="mt-1 text-xs text-white/35">Direct SMS · not linked to a booking</p>
                    </div>
                    <time className="text-xs text-white/30">{new Date(thread.latestAt).toLocaleString()}</time>
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-5">
                    {thread.messages.map((message) => {
                      const outbound = message.direction === "outbound";
                      return (
                        <div key={message.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[86%] rounded-2xl px-4 py-3 ${outbound ? "bg-[#6EAEC6] text-[#0B1822]" : "bg-white/8 text-white"}`}>
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                            <p className={`mt-2 text-[10px] ${outbound ? "text-[#0B1822]/50" : "text-white/30"}`}>
                              {outbound ? "Car Dash" : "Customer"} · {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form
                    className="border-t border-white/8 bg-black/15 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendUnmatchedReply(thread.phone);
                    }}
                  >
                    <div className="flex gap-2">
                      <textarea
                        value={replyDrafts[thread.phone] || ""}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({ ...current, [thread.phone]: event.target.value }))
                        }
                        placeholder="Text this number…"
                        maxLength={3000}
                        className="min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#6EAEC6]/55"
                      />
                      <button
                        type="submit"
                        disabled={replySending === thread.phone || !String(replyDrafts[thread.phone] || "").trim()}
                        className="self-end rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-[#0B1822] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {replySending === thread.phone ? "Sending…" : "Send"}
                      </button>
                    </div>
                    {replyNotes[thread.phone] && (
                      <p className="mt-2 text-xs text-white/45">{replyNotes[thread.phone]}</p>
                    )}
                  </form>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
