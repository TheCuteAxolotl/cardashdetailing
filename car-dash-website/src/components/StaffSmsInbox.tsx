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

type InboxPayload = {
  conversations: InboxRow[];
  totalUnread: number;
};

export default function StaffSmsInbox({
  role,
}: {
  role: "owner" | "admin";
}) {
  const [data, setData] = useState<InboxPayload>({ conversations: [], totalUnread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return window.location.assign("/login");
      const payload = await response.json();
      if (payload.user.role === "owner" && role === "admin") {
        return window.location.assign("/owner/messages");
      }
      if (payload.user.role !== role) return window.location.assign("/");
      await load();
    })();

    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, [load, role]);

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

  const backHref = role === "owner" ? "/owner/dashboard" : "/admin/dashboard";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">SMS Inbox</h1>
              {data.totalUnread > 0 && (
                <span className="rounded-full bg-[#FF2D2D] px-2.5 py-1 text-xs font-bold text-[#0D0D0D]">
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
        <div className="rounded-3xl border border-white/10 bg-white/[.025] p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, phone, vehicle, or message…"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#FF2D2D]/60"
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
                  className={`block rounded-3xl border p-5 transition hover:border-[#FF2D2D]/45 ${
                    row.unreadCount > 0
                      ? "border-[#FF2D2D]/35 bg-[#FF2D2D]/[.06]"
                      : "border-white/10 bg-white/[.025]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{booking.customerName}</h2>
                        {row.unreadCount > 0 && (
                          <span className="rounded-full bg-[#FF2D2D] px-2 py-0.5 text-[10px] font-bold text-[#0D0D0D]">
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
      </div>
    </main>
  );
}
