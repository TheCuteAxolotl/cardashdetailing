"use client";

import GiftCardPurchase from "@/components/GiftCardPurchase";
import { cleanGiftCode, giftMoney, validGiftCode } from "@/lib/gift-cards";
import { useEffect, useRef, useState, type FormEvent } from "react";

type CardStatus = "active" | "paused" | "used" | "empty";
type CheckResult = { balance: number; lastFour: string; status: CardStatus };

const statusDetails: Record<CardStatus, { title: string; description: string; color: string }> = {
  active: {
    title: "Active · Ready to use",
    description: "This balance can be applied toward an eligible Car Dash detailing service. Present your card number when paying.",
    color: "text-[#d6b779]",
  },
  paused: {
    title: "Temporarily paused",
    description: "This card still has the balance shown, but it cannot be used until Car Dash reactivates it. Contact us for assistance.",
    color: "text-amber-200",
  },
  used: {
    title: "Fully redeemed",
    description: "This gift card has been marked as used and has no remaining credit.",
    color: "text-[#d4d0c8]",
  },
  empty: {
    title: "No balance available",
    description: "This gift card currently has a $0 balance. It may not have been loaded yet, or its credit may have been spent. Contact Car Dash if you expected a balance.",
    color: "text-[#d4d0c8]",
  },
};

export default function GiftCardsPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sequence = useRef(0);

  useEffect(() => {
    // Returning Stripe customers should land on their purchase confirmation.
    if (new URLSearchParams(window.location.search).has("purchase")) {
      document.getElementById("buy-gift-card")?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);

  async function check(value: string) {
    const normalized = cleanGiftCode(value);
    const current = ++sequence.current;
    setError("");
    setResult(null);

    if (!validGiftCode(normalized)) {
      setBusy(false);
      setError("Enter the full 16- or 20-character gift card number printed on your card.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
        cache: "no-store",
      });
      const payload = await response.json();
      if (current !== sequence.current) return;
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Unable to check this card right now.");
      if (!["active", "paused", "used", "empty"].includes(payload.status) || !Number.isFinite(payload.balance)) {
        throw new Error("Unable to read this gift card right now.");
      }
      setResult({ balance: payload.balance, lastFour: payload.lastFour, status: payload.status });
    } catch (cause) {
      if (current === sequence.current) {
        setError(cause instanceof Error ? cause.message : "Unable to check your card. Please try again.");
      }
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void check(code);
  }

  function editCode(value: string) {
    sequence.current += 1;
    setCode(value.toUpperCase());
    setBusy(false);
    setError("");
    setResult(null);
  }

  const detail = result ? statusDetails[result.status] : null;

  return (
    <main className="min-h-screen bg-[#101010] px-4 py-10 text-[#f4efe5] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d6b779]">Car Dash Detailing · Gift cards</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-[#f4efe5] sm:text-5xl">Check your gift card.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#ccc6ba]">
            Have a gift card? Check its remaining balance and status instantly, without an account.
          </p>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[1.2fr_.8fr]">
          <section id="check-gift-card" aria-labelledby="check-title" className="rounded-2xl border border-[#d6b779]/35 bg-[#1c1c1c] p-5 shadow-[0_20px_70px_rgba(0,0,0,.20)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d6b779]/30 bg-[#d6b779]/10 text-[#d6b779]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18M7 15h4" />
                </svg>
              </span>
              <div>
                <h2 id="check-title" className="text-xl font-semibold text-[#f4efe5]">Gift card code checker</h2>
                <p className="mt-1 text-sm text-[#c9c4bb]">Free · Instant · No login needed</p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-7">
              <label htmlFor="gift-card-code" className="block text-sm font-semibold text-[#f4efe5]">Gift card code</label>
              <p id="gift-code-help" className="mt-2 text-sm leading-6 text-[#c9c4bb]">
                Find the unique code printed on your physical card or purchase receipt. Spaces and dashes are okay.
              </p>
              <input
                id="gift-card-code"
                name="gift-card-code"
                value={code}
                onChange={event => editCode(event.target.value)}
                aria-describedby="gift-code-help"
                aria-invalid={Boolean(error)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={24}
                required
                className="mt-3 w-full rounded-xl border border-white/30 bg-[#101010] px-4 py-4 font-mono text-base tracking-[.07em] text-white placeholder:text-[#99938a] focus:border-[#d6b779] focus:outline-none focus:ring-2 focus:ring-[#d6b779]/30 sm:text-lg"
              />
              <button disabled={busy} type="submit" className="mt-4 w-full rounded-xl bg-[#d6b779] px-5 py-4 text-base font-bold text-[#101010] transition hover:bg-[#e5c995] disabled:cursor-wait disabled:opacity-50">
                {busy ? "Checking card…" : "Check balance & status"}
              </button>
            </form>

            {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/35 bg-red-900/15 px-4 py-4 text-sm leading-6 text-red-100">{error}</div>}

            {result && detail && (
              <div role="status" aria-live="polite" className="mt-7 rounded-xl border border-[#d6b779]/30 bg-[#27241e] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${detail.color}`}>{detail.title}</span>
                  <span className="font-mono text-xs tracking-wide text-[#c9c4bb]">Card ending {result.lastFour}</span>
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-[#c9c4bb]">Remaining balance</p>
                <p className="mt-2 font-serif text-5xl leading-tight text-[#f4efe5]">{giftMoney(result.balance)}</p>
                <p className="mt-4 text-sm leading-7 text-[#d8d3c9]">{detail.description}</p>
                <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-[#bcb6ac]">This check does not redeem, reload, or change your gift card.</p>
              </div>
            )}

            <p className="mt-6 text-xs leading-6 text-[#bcb6ac]">
              Keep your code private, just like cash. For a lost, unreadable, or unrecognized code, contact Car Dash.
            </p>
          </section>

          <aside className="rounded-2xl border border-white/15 bg-[#191919] p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#d6b779]">Using your card</p>
            <h2 className="mt-3 font-serif text-2xl text-[#f4efe5]">A detail, on them.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbc6be]">
              Gift card credit can be applied toward Car Dash detailing services. Show your code when you pay, and we’ll record the amount redeemed.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a href="/#book" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold text-[#f4efe5] hover:border-[#d6b779]">Book a detail</a>
              <a href="/contact" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold text-[#f4efe5] hover:border-[#d6b779]">Contact Car Dash</a>
            </div>
            <p className="mt-6 border-t border-white/15 pt-5 text-xs leading-6 text-[#bcb6ac]">
              Online checkout doesn’t automatically spend gift-card credit. Car Dash applies it when your service is paid.
            </p>
          </aside>
        </div>

        <section id="buy-gift-card" className="mt-12 scroll-mt-28 border-t border-white/15 pt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#d6b779]">Give the gift of a clean car</p>
            <h2 className="mt-3 font-serif text-3xl text-[#f4efe5]">Buy a gift card</h2>
          </div>
          <GiftCardPurchase />
        </section>
      </div>
    </main>
  );
}
