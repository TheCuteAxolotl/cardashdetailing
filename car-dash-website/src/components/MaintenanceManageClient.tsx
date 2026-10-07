"use client";

import { useEffect, useState } from "react";

type Subscription = {
  id: string;
  planName: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
};

export default function MaintenanceManageClient({
  token,
  sessionId,
}: {
  token: string;
  sessionId?: string | null;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
      const response = await fetch(`/api/maintenance/manage/${encodeURIComponent(token)}${query}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load subscription.");
      setSubscription(payload.subscription);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load subscription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, sessionId]);

  const update = async (action: "cancel" | "resume") => {
    setWorking(true);
    setMessage("");
    try {
      const response = await fetch(`/api/maintenance/manage/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update subscription.");
      setSubscription(payload.subscription);
      setMessage(payload.message || "Subscription updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update subscription.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-[420px] place-items-center text-white/42">Loading your subscription…</div>;
  }

  if (!subscription) {
    return <div className="mx-auto max-w-xl py-20 text-center text-white/55">{message || "Subscription not found."}</div>;
  }

  const endDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const canceled = subscription.status === "canceled";
  const active = ["active", "trialing", "past_due", "unpaid"].includes(subscription.status);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-6 shadow-[0_28px_90px_rgba(0,0,0,.18)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/36">Car Dash maintenance</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">{subscription.planName}</h1>
            <p className="mt-2 text-sm text-white/40">{subscription.customerName} · {subscription.customerEmail}</p>
          </div>
          <span className="w-fit rounded-full border border-white/12 bg-white/[.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white/60">
            {subscription.cancelAtPeriodEnd ? "Canceling" : subscription.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/18 p-5">
            <p className="text-[10px] uppercase tracking-[.16em] text-white/28">Monthly payment</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-.04em]">${(subscription.amountCents / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/18 p-5">
            <p className="text-[10px] uppercase tracking-[.16em] text-white/28">
              {subscription.cancelAtPeriodEnd ? "Ends" : "Next period"}
            </p>
            <p className="mt-2 text-lg font-semibold">{endDate || "Updating from Stripe"}</p>
          </div>
        </div>

        {sessionId && active && !subscription.cancelAtPeriodEnd && (
          <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.055] px-5 py-4 text-sm leading-6 text-emerald-100/75">
            You’re subscribed. Your recurring payment is set up with Stripe.
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 rounded-2xl border border-amber-400/18 bg-amber-400/[.055] px-5 py-4 text-sm leading-6 text-amber-100/75">
            Your plan is set to stop renewing{endDate ? ` after ${endDate}` : " after the current billing period"}. You can resume it before then.
          </div>
        )}

        {message && <p className="mt-5 text-sm text-white/55">{message}</p>}

        <div className="mt-7 flex flex-wrap gap-3">
          {!canceled && subscription.stripeSubscriptionId && !subscription.cancelAtPeriodEnd && (
            <button
              type="button"
              disabled={working}
              onClick={() => {
                if (window.confirm("Stop future monthly renewals after the current billing period?")) void update("cancel");
              }}
              className="rounded-full border border-red-400/25 bg-red-500/[.06] px-5 py-3 text-sm font-semibold text-red-200 disabled:opacity-45"
            >
              {working ? "Updating…" : "Cancel subscription"}
            </button>
          )}
          {!canceled && subscription.stripeSubscriptionId && subscription.cancelAtPeriodEnd && (
            <button
              type="button"
              disabled={working}
              onClick={() => void update("resume")}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171411] disabled:opacity-45"
            >
              {working ? "Updating…" : "Keep subscription active"}
            </button>
          )}
          <a href="/contact" className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/65 hover:text-white">Contact Car Dash</a>
        </div>
      </div>
    </div>
  );
}
