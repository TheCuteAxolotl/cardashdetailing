"use client";

import { useCallback, useEffect, useState } from "react";

type PhoneStatus = "loading" | "ready" | "error";
function formattedPhone(input: string) {
  const digits = input.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10
    ? "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6)
    : input;
}

export default function LinkPhoneMessages() {
  const [status, setStatus] = useState<PhoneStatus>("loading");
  const [phones, setPhones] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const r = await fetch("/api/account/phone-connection", { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(data.phones)) {
        throw new Error(data.error || "Could not check your connected number.");
      }
      setPhones(data.phones);
      setStatus("ready");
      return data.phones as string[];
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not check your number.");
      return null;
    }
  }, []);
  useEffect(() => {
    setPhone(new URLSearchParams(window.location.search).get("linkPhone") || "");
    void refresh();
  }, [refresh]);

  async function submit(action: "send" | "verify") {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const r = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || (action === "verify" && data.success !== true)) {
        throw new Error(data.error || "Could not verify this number.");
      }
      if (action === "send") {
        setSent(true);
        setNote("Verification code sent. Check your messages and enter the six-digit code.");
      } else {
        const connected = await refresh();
        if (!connected || !connected.length) throw new Error("Your number was verified, but the connection status could not be confirmed. Refresh this page.");
        setSent(false);
        setCode("");
        setPhone("");
        setNote("Number connected. Your matching text history and conversations are now available.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link your number.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect(number: string) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const r = await fetch("/api/account/phone-connection", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: number, confirmation: "REMOVE" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.removed !== true) {
        throw new Error(data.error || "Could not remove the number.");
      }
      setRemoving(null);
      setPhone("");
      setSent(false);
      setCode("");
      await refresh();
      setNote("Mobile number disconnected. You can verify a new number whenever you're ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this number.");
    } finally {
      setBusy(false);
    }
  }

  const outer = "mx-5 my-6 rounded-2xl border border-[#d6b779]/30 bg-[#1b1a18] p-5 text-[#f4efe5] sm:p-6";
  const button = "rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-semibold text-[#171715] transition hover:bg-[#ead4a4] disabled:cursor-not-allowed disabled:opacity-45";
  const field = "mt-2 block w-full rounded-xl border border-white/20 bg-[#292723] px-4 py-3 text-base text-[#f4eee4] outline-none focus:border-[#d6b779]";

  if (status === "loading") {
    return <section className={outer} aria-live="polite">
      <p className="text-sm text-[#bdb2a2]">Checking your connected phone number…</p>
    </section>;
  }
  if (status === "error") {
    return <section className={outer} role="alert">
      <h2 className="text-lg font-semibold">Mobile number connection</h2>
      <p className="mt-2 text-sm text-red-200">{error}</p>
      <button type="button" onClick={() => void refresh()} className={button + " mt-4"}>Try again</button>
    </section>;
  }

  if (phones.length > 0) {
    return <section className={outer}>
      <p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#d6b779]">Account connections</p>
      <h2 className="mt-1 text-xl font-semibold">Connected mobile number</h2>
      <p className="mt-2 text-sm leading-6 text-[#b9afa3]">
        Your verified number is linked to this account. The original number is used for your SMS conversations.
      </p>
      <div className="mt-4 space-y-3">
        {phones.map(number =>
          <div key={number} className="rounded-xl border border-white/10 bg-[#26241f] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold tabular-nums text-[#f2ebdf]">{formattedPhone(number)}</p>
                <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#719b7b]/30 bg-[#274132] px-3 py-1 text-[11px] font-semibold text-[#c3dfc8]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9dd5a6]" /> Connected · Verified
                </span>
              </div>
              <button type="button" disabled={busy} onClick={() => {setRemoving(number);setError("");}}
                className="rounded-xl border border-red-300/30 px-4 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-40">
                Remove number
              </button>
            </div>
            {removing === number && <div className="mt-4 rounded-xl border border-amber-300/25 bg-[#34291e] p-4">
              <p className="text-sm font-semibold text-[#f0d5ab]">Disconnect {formattedPhone(number)}?</p>
              <p className="mt-2 text-xs leading-6 text-[#d4c3ad]">
                Use this before transferring your phone number to someone else. Previous bookings and messages remain in your account,
                but future SMS won't be linked to those older conversations. Saved contact information for this number will be cleared.
                Existing appointments may still have the old number on file; update those separately.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void disconnect(number)}
                  className="rounded-xl bg-red-300 px-4 py-2.5 text-xs font-bold text-[#261712] disabled:opacity-40">
                  {busy ? "Removing…" : "Yes, disconnect"}
                </button>
                <button type="button" disabled={busy} onClick={() => setRemoving(null)}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-[#eee6da] disabled:opacity-40">
                  Keep connected
                </button>
              </div>
            </div>}
          </div>
        )}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
      {note && <p role="status" className="mt-4 text-sm text-[#dfc795]">{note}</p>}
      <a href="/quote" className="mt-5 inline-flex text-sm font-semibold text-[#e3c991] underline">Open my conversations</a>
    </section>;
  }

  return <section className={outer}>
    <p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#d6b779]">Account connections</p>
    <h2 className="mt-1 text-xl font-semibold">Connect your text messages</h2>
    <p className="mt-2 text-sm leading-6 text-[#b9afa3]">
      Already texted Car Dash? Verify the same mobile number to bring your text history and quote conversations into this account.
    </p>
    <label className="mt-4 block text-sm font-medium text-[#e7ddcf]">
      Mobile number
      <input type="tel" autoComplete="tel" value={phone} onChange={e => {setPhone(e.target.value);setSent(false);setCode("");}}
        placeholder="(224) 555-0123" className={field} />
    </label>
    <button type="button" disabled={busy || !phone.trim()} onClick={() => void submit("send")} className={button + " mt-3"}>
      {busy && !sent ? "Sending…" : "Send verification code"}
    </button>
    {sent && <div className="mt-4 rounded-xl border border-white/10 bg-[#272520] p-4">
      <label className="block text-sm font-medium text-[#e7ddcf]">
        Six-digit verification code
        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
          className={field} />
      </label>
      <button type="button" disabled={busy || code.length !== 6} onClick={() => void submit("verify")} className={button + " mt-3"}>
        {busy ? "Verifying…" : "Verify & connect conversations"}
      </button>
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
    {note && <p role="status" className="mt-3 text-sm text-[#dfc795]">{note}</p>}
    <a href="/quote" className="mt-4 block text-sm text-[#e3c991] underline">Open my conversations</a>
  </section>;
}
