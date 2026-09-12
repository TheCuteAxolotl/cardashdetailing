"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type VoiceConnection = {
  ok?: boolean;
  healthy?: boolean;
  expectedUrl?: string;
  currentUrl?: string;
  currentMethod?: string;
  businessNumber?: string | null;
  forwardNumberMasked?: string | null;
  runtime?: {
    accountSidConfigured?: boolean;
    authTokenConfigured?: boolean;
    voiceNumberConfigured?: boolean;
    forwardNumberConfigured?: boolean;
    configured?: boolean;
  };
  error?: string;
};

type BlockedCaller = {
  id: string;
  phoneNumber: string;
  reason: string | null;
  createdAt: string;
};

type CallRow = {
  id: string;
  callSid: string;
  fromPhone: string;
  toPhone: string | null;
  status: string;
  blocked: boolean;
  durationSeconds: number | null;
  screenAccepted: boolean;
  voicemailRecordingSid: string | null;
  voicemailDurationSeconds: number | null;
  voicemailAt: string | null;
  startedAt: string;
  endedAt: string | null;
  customer: {
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
  } | null;
};

function formatDuration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
}

function statusLabel(status: string) {
  return status.replace(/-/g, " ");
}

export default function OwnerCallsPage() {
  const [connection, setConnection] = useState<VoiceConnection | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedCaller[]>([]);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const auth = await fetch("/api/auth/me", { cache: "no-store" });
      if (!auth.ok) return window.location.assign("/login");
      const authPayload = await auth.json();
      const owner = authPayload.user.role === "owner";
      if (!owner && !authPayload.permissions?.includes("businessPhone")) return window.location.assign(authPayload.staffAccess ? "/admin/dashboard" : "/dashboard");
      setIsOwner(owner);

      const [callsResponse, blocksResponse, connectionResponse] = await Promise.all([
        fetch("/api/voice/calls", { cache: "no-store" }),
        fetch("/api/voice/blocks", { cache: "no-store" }),
        fetch("/api/voice/connection", { cache: "no-store" }),
      ]);

      const callsPayload = await callsResponse.json().catch(() => ({}));
      const blocksPayload = await blocksResponse.json().catch(() => ({}));
      const connectionPayload = await connectionResponse.json().catch(() => ({}));

      if (callsResponse.ok) setCalls(Array.isArray(callsPayload.calls) ? callsPayload.calls : []);
      if (blocksResponse.ok) setBlocked(Array.isArray(blocksPayload.blocked) ? blocksPayload.blocked : []);
      setConnection(connectionPayload);

      if (!callsResponse.ok || !blocksResponse.ok) {
        setError(callsPayload.error || blocksPayload.error || "Could not load the business phone dashboard.");
      }
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load the business phone dashboard.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const blockedSet = useMemo(
    () => new Set(blocked.map((entry) => entry.phoneNumber)),
    [blocked]
  );

  const visibleCalls = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return calls;
    return calls.filter((call) => {
      const customer = call.customer;
      return [
        call.fromPhone,
        call.status,
        customer?.customerName || "",
        customer?.customerEmail || "",
        customer?.serviceName || "",
        customer?.vehicleYear || "",
        customer?.vehicleMake || "",
        customer?.vehicleModel || "",
        customer?.vehicleTrim || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [calls, query]);

  async function repairConnection() {
    setRepairing(true);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/voice/connection", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not connect Twilio Voice.");
      setConnection(payload);
      setNote("Twilio Voice is now connected to the Car Dash call system.");
    } catch (repairError) {
      setError(repairError instanceof Error ? repairError.message : "Could not connect Twilio Voice.");
    } finally {
      setRepairing(false);
    }
  }

  async function blockNumber(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/voice/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not block that number.");
      setPhoneNumber("");
      setReason("");
      setNote(`${payload.blocked.phoneNumber} is now blocked from calling Car Dash.`);
      await load(true);
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : "Could not block that number.");
    } finally {
      setSaving(false);
    }
  }

  async function blockFromCall(phone: string) {
    setSaving(true);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/voice/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, reason: "Blocked from call history" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not block that number.");
      setNote(`${payload.blocked.phoneNumber} is now blocked.`);
      await load(true);
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : "Could not block that number.");
    } finally {
      setSaving(false);
    }
  }

  async function unblock(id: string) {
    setSaving(true);
    setError("");
    setNote("");
    try {
      const response = await fetch(`/api/voice/blocks/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not unblock that number.");
      setNote("Number unblocked.");
      await load(true);
    } catch (unblockError) {
      setError(unblockError instanceof Error ? unblockError.message : "Could not unblock that number.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">Car Dash Phone</p>
            <h1 className="mt-1 text-2xl font-bold">Business Calls</h1>
            <p className="mt-1 text-sm text-white/40">Forward calls, screen them before connecting, save Car Dash voicemail, keep call history, and block unwanted callers.</p>
          </div>
          <a href={isOwner ? "/owner/dashboard" : "/admin/dashboard"} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 hover:text-white">Back</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className={`rounded-3xl border p-6 ${connection?.healthy ? "border-emerald-500/25 bg-emerald-500/[.05]" : "border-amber-500/25 bg-amber-500/[.05]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${connection?.healthy ? "bg-emerald-400" : "bg-amber-400"}`} />
                <h2 className="font-semibold">Voice connection</h2>
              </div>
              <p className="mt-2 text-sm text-white/55">
                {connection?.healthy
                  ? "Incoming calls are routed through the Car Dash website before they reach your phone."
                  : connection?.error || "Twilio Voice still needs to be connected."}
              </p>
              <div className="mt-4 grid gap-2 text-xs text-white/40 sm:grid-cols-2">
                <p>Business number: <span className="text-white/70">{connection?.businessNumber || "Not configured"}</span></p>
                <p>Forwards to: <span className="text-white/70">{connection?.forwardNumberMasked || "Not configured"}</span></p>
                {connection?.expectedUrl && <p className="break-all sm:col-span-2">Voice webhook: {connection.expectedUrl}</p>}
              </div>
            </div>
            {!connection?.healthy && isOwner && (
              <button
                type="button"
                onClick={repairConnection}
                disabled={repairing}
                className="rounded-full bg-[#FF2D2D] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] disabled:opacity-50"
              >
                {repairing ? "Connecting…" : "Repair Voice Connection"}
              </button>
            )}
          </div>
          <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-white/45">
            Save your Car Dash business number as a contact on your iPhone. When you answer, Car Dash asks you to press 1 before connecting the customer. If you do not press 1 — including when your personal voicemail answers — the customer is sent to Car Dash voicemail instead.
          </p>
        </section>

        {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm text-red-200">{error}</p>}
        {note && <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-4 text-sm text-emerald-200">{note}</p>}

        <section className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="text-xl font-semibold">Block a caller</h2>
            <p className="mt-1 text-sm text-white/40">Blocked numbers are rejected before the call is forwarded to your phone.</p>
            <form onSubmit={blockNumber} className="mt-5 space-y-3">
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Phone number, e.g. (630) 555-1234"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#FF2D2D]/60"
              />
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason (optional)"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#FF2D2D]/60"
              />
              <button disabled={saving} className="rounded-full bg-[#FF2D2D] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] disabled:opacity-50">Block Number</button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Blocked numbers</h2>
                <p className="mt-1 text-sm text-white/40">{blocked.length} blocked</p>
              </div>
            </div>
            <div className="mt-5 max-h-64 space-y-2 overflow-y-auto pr-1">
              {blocked.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{entry.phoneNumber}</p>
                    <p className="truncate text-xs text-white/35">{entry.reason || "No reason added"}</p>
                  </div>
                  <button type="button" onClick={() => unblock(entry.id)} disabled={saving} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/65 hover:text-white disabled:opacity-50">Unblock</button>
                </div>
              ))}
              {!blocked.length && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">No blocked callers.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Call history</h2>
              <p className="mt-1 text-sm text-white/40">Recent calls to the Car Dash business number.</p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search calls…"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#FF2D2D]/60 sm:w-72"
            />
          </div>

          {loading ? (
            <div className="grid min-h-48 place-items-center text-sm text-white/40">Loading calls…</div>
          ) : (
            <div className="mt-5 space-y-3">
              {visibleCalls.map((call) => {
                const customer = call.customer;
                const vehicle = customer
                  ? [customer.vehicleYear, customer.vehicleMake, customer.vehicleModel, customer.vehicleTrim].filter(Boolean).join(" ")
                  : "";
                const nowBlocked = blockedSet.has(call.fromPhone);

                return (
                  <div key={call.id} className={`rounded-2xl border p-4 ${call.blocked ? "border-red-500/20 bg-red-500/[.04]" : "border-white/10 bg-black/20"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{customer?.customerName || call.fromPhone}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] ${call.blocked ? "border-red-500/25 text-red-300" : "border-white/10 text-white/45"}`}>
                            {call.blocked ? "Blocked" : statusLabel(call.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/35">{call.fromPhone}{customer ? ` · ${customer.serviceName}${vehicle ? ` · ${vehicle}` : ""}` : ""}</p>
                        <p className="mt-2 text-xs text-white/35">{new Date(call.startedAt).toLocaleString()} · Duration {formatDuration(call.durationSeconds)}</p>
                        {call.voicemailRecordingSid && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                              <span className="font-semibold text-white/75">Car Dash voicemail</span>
                              <span>· {formatDuration(call.voicemailDurationSeconds)}</span>
                              {call.voicemailAt && <span>· {new Date(call.voicemailAt).toLocaleString()}</span>}
                            </div>
                            <audio controls preload="none" className="h-9 w-full" src={`/api/voice/voicemail/${call.id}`} />
                          </div>
                        )}
                      </div>
                      {!call.blocked && !nowBlocked && call.fromPhone.startsWith("+") && (
                        <button type="button" onClick={() => blockFromCall(call.fromPhone)} disabled={saving} className="rounded-full border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50">Block</button>
                      )}
                      {nowBlocked && !call.blocked && <span className="text-xs text-red-300/70">Now blocked</span>}
                    </div>
                  </div>
                );
              })}
              {!visibleCalls.length && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/35">{query ? "No calls match that search." : "No calls yet."}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
