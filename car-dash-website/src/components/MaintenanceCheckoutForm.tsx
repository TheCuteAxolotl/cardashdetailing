"use client";

import { FormEvent, useState } from "react";

export default function MaintenanceCheckoutForm({
  offerToken,
  planName,
  description,
  amountCents,
  defaultCustomerName = "",
  defaultCustomerEmail = "",
  defaultCustomerPhone = "",
  lockName = false,
  lockEmail = false,
  lockPhone = false,
}: {
  offerToken?: string | null;
  planName: string;
  description: string;
  amountCents: number;
  defaultCustomerName?: string;
  defaultCustomerEmail?: string;
  defaultCustomerPhone?: string;
  lockName?: boolean;
  lockEmail?: boolean;
  lockPhone?: boolean;
}) {
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [customerEmail, setCustomerEmail] = useState(defaultCustomerEmail);
  const [customerPhone, setCustomerPhone] = useState(defaultCustomerPhone);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/maintenance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerToken: offerToken || undefined,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not start subscription checkout.");
      if (!payload.url) throw new Error("Stripe did not return a checkout link.");
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout.");
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
      <aside className="rounded-[22px] border border-white/10 bg-white/[.035] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,.16)] sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/38">Monthly maintenance</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">{planName}</h2>
        <p className="mt-4 text-sm leading-7 text-white/48">{description}</p>
        <div className="mt-7 border-t border-white/10 pt-6">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-.06em]">${(amountCents / 100).toFixed(0)}</span>
            <span className="pb-1 text-sm text-white/40">/ month</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/34">
            Recurring monthly payment through Stripe. You can cancel future renewals from your private subscription page.
          </p>
        </div>
      </aside>

      <form onSubmit={submit} className="rounded-[22px] border border-white/10 bg-white/[.028] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,.14)] sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/36">Start membership</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-.035em]">Set up your monthly plan.</h3>
        <p className="mt-2 text-sm leading-6 text-white/42">Enter your details, then Stripe will securely collect your payment method.</p>

        <div className="mt-6 grid gap-4">
          <label className="text-xs font-semibold text-white/55">
            Name
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              readOnly={lockName}
              required
              className="customer-input mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none read-only:cursor-not-allowed read-only:text-white/55"
            />
          </label>

          <label className="text-xs font-semibold text-white/55">
            Email
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              readOnly={lockEmail}
              required
              className="customer-input mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none read-only:cursor-not-allowed read-only:text-white/55"
            />
          </label>

          <label className="text-xs font-semibold text-white/55">
            Phone <span className="font-normal text-white/25">(optional)</span>
            <input
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              readOnly={lockPhone}
              placeholder="(630) 555-0123"
              className="customer-input mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/20 read-only:cursor-not-allowed read-only:text-white/55"
            />
          </label>
        </div>

        {message && (
          <p className="mt-5 rounded-xl border border-red-400/15 bg-red-500/[.06] px-4 py-3 text-sm text-red-100/80">{message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-[#171411] transition hover:bg-[#EFE8E2] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? "Opening secure checkout…" : `Subscribe for $${(amountCents / 100).toFixed(2)}/month`}
        </button>
        <p className="mt-4 text-center text-[11px] leading-5 text-white/28">Secure recurring billing is handled by Stripe.</p>
      </form>
    </div>
  );
}
