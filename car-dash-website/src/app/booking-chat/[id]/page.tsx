"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Booking = {
  id: string;
  serviceName: string;
  serviceMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  quotedPrice: number | null;
  status: string;
  createdAt: string;
};

type BookingMessage = {
  id: string;
  sender: string;
  body: string;
  channel?: string;
  createdAt: string;
};

type ChatData = {
  booking: Booking;
  messages: BookingMessage[];
  lastCustomerSeenAt: string | null;
  viewer: "staff" | "customer";
  authRole: string;
};

export default function BookingChatPage() {
  const params = useParams<{ id: string }>();
  const bookingId = String(params?.id || "");
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key") || "";
    setAccessKey(key);
  }, []);

  const endpoint = useMemo(() => {
    if (!bookingId || accessKey === null) return "";
    const suffix = accessKey ? `?key=${encodeURIComponent(accessKey)}` : "";
    return `/api/bookings/${encodeURIComponent(bookingId)}/chat${suffix}`;
  }, [bookingId, accessKey]);

  const load = useCallback(
    async (quiet = false) => {
      if (!endpoint) return;
      if (!quiet) setLoading(true);

      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load this booking chat.");
        setData(payload);
        setError("");
      } catch (err) {
        if (!quiet) setData(null);
        setError(err instanceof Error ? err.message : "Could not load this booking chat.");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    if (!endpoint) return;
    load();
    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, [endpoint, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [data?.messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const message = reply.trim();
    if (!message || !endpoint || sending) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not send message.");
      setReply("");
      if (payload.warning) {
        setNotice(payload.warning);
      } else if (data?.viewer === "staff" && payload.delivery === "sms") {
        setNotice("Text message sent to the customer.");
      } else {
        setNotice("Message sent.");
      }
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading || accessKey === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#FF2D2D]" />
          <p className="mt-4 text-sm text-white/40">Loading booking conversation…</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[.025] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#FF2D2D]">Booking chat</p>
          <h1 className="mt-3 text-2xl font-semibold">Conversation unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">{error || "This booking chat could not be opened."}</p>
          <a href="/login" className="mt-6 inline-block rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Sign in</a>
        </div>
      </main>
    );
  }

  const { booking, viewer, authRole } = data;
  const staff = viewer === "staff";
  const backHref = staff
    ? authRole === "owner"
      ? "/owner/bookings"
      : "/admin/bookings"
    : authRole === "guest"
      ? "/"
      : "/account";
  const vehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
    .filter(Boolean)
    .join(" ");
  const recentlyActive =
    data.lastCustomerSeenAt && Date.now() - new Date(data.lastCustomerSeenAt).getTime() < 90_000;

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.26em] text-[#FF2D2D]">Booking conversation</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">{booking.serviceName}</h1>
            <p className="mt-2 text-sm text-white/40">
              {staff ? `${booking.customerName} · ${booking.customerEmail}` : "Message Car Dash Detailing about this appointment."}
            </p>
          </div>
          <a href={backHref} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:text-white">
            Back
          </a>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="flex min-h-[650px] flex-col rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{vehicle}</p>
                  <p className="mt-1 text-xs text-white/35">
                    Booking #{booking.id.slice(-7)} · {booking.preferredDate || "Date not specified"}
                    {booking.preferredTime ? ` · ${booking.preferredTime}` : ""}
                  </p>
                  {staff && (
                    <p className="mt-1 text-xs text-white/25">
                      Customer presence: {recentlyActive ? "currently/recently active" : "offline"}
                    </p>
                  )}
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase text-white/55">{booking.status}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto py-5">
              {data.messages.length ? (
                data.messages.map((message) => {
                  if (message.sender === "system") {
                    return (
                      <p key={message.id} className="py-1 text-center text-[10px] uppercase tracking-[.16em] text-white/25">
                        {message.body}
                      </p>
                    );
                  }

                  const mine = staff ? message.sender === "team" : message.sender === "customer";
                  return (
                    <div
                      key={message.id}
                      className={`max-w-[86%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-[#FF2D2D] text-[#0D0D0D]" : "bg-white/8"}`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] opacity-45">
                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                        {message.channel === "sms" && (
                          <span className="rounded-full border border-current/30 px-1.5 py-0.5 uppercase tracking-[.12em]">SMS</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid min-h-80 place-items-center text-center">
                  <div>
                    <p className="text-lg font-semibold">No messages yet.</p>
                    <p className="mt-2 text-sm text-white/35">
                      {staff ? "Send the customer a message about their appointment." : "Ask a question about your booking here."}
                    </p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-3 text-sm text-red-200">{error}</p>}
            {notice && <p className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-3 text-sm text-emerald-200">{notice}</p>}

            <form onSubmit={send} className="flex gap-2 border-t border-white/10 pt-4">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={staff ? "Text customer…" : "Message Car Dash Detailing…"}
                maxLength={3000}
                className="min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#FF2D2D]/60"
              />
              <button
                disabled={sending || !reply.trim()}
                className="self-end rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#FF2D2D]">Booking details</p>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-white/30">Total</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-300">
                  {booking.quotedPrice != null ? `$${booking.quotedPrice.toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/30">Vehicle</p>
                <p className="mt-1 text-white/75">{vehicle}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Preferred appointment</p>
                <p className="mt-1 text-white/75">
                  {booking.preferredDate || "Not specified"}{booking.preferredTime ? ` · ${booking.preferredTime}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/30">Service method</p>
                <p className="mt-1 capitalize text-white/75">{booking.serviceMethod || "Not specified"}</p>
              </div>
              {staff && (
                <>
                  <div>
                    <p className="text-xs text-white/30">Phone</p>
                    <a href={`tel:${booking.customerPhone}`} className="mt-1 block text-white/75 underline">{booking.customerPhone}</a>
                  </div>
                  <div>
                    <p className="text-xs text-white/30">Email</p>
                    <a href={`mailto:${booking.customerEmail}`} className="mt-1 block break-all text-white/75 underline">{booking.customerEmail}</a>
                  </div>
                </>
              )}
            </div>

            {!staff && authRole === "guest" && (
              <p className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-white/40">
                This is your secure booking-chat link. Keep it private so only you can access this conversation.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
