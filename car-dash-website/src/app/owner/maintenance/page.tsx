"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Offer = {
  id: string;
  shareToken: string;
  name: string;
  description: string;
  amountCents: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  active: boolean;
  createdAt: string;
};

type Subscription = {
  id: string;
  offerId: string | null;
  manageToken: string;
  planName: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  createdAt: string;
};

type Payload = {
  standardPlan: { name: string; description: string; amountCents: number };
  offers: Offer[];
  subscriptions: Subscription[];
  stripeConfigured: boolean;
};

const emptyForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  name: "Custom Maintenance",
  description: "",
  monthlyPrice: "60",
};

function money(cents: number) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function statusStyle(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return "border-amber-500/20 bg-amber-500/8 text-amber-700";
  if (["active", "trialing"].includes(status)) return "border-emerald-500/20 bg-emerald-500/8 text-emerald-700";
  if (["past_due", "unpaid"].includes(status)) return "border-red-500/20 bg-red-500/8 text-red-700";
  if (status === "canceled") return "border-black/10 bg-black/[.035] text-black/45";
  return "border-blue-500/15 bg-blue-500/[.06] text-blue-700";
}

export default function OwnerMaintenancePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/maintenance/owner", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load subscriptions.");
      setData(payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, []);

  const activeSubscriptions = useMemo(
    () => (data?.subscriptions || []).filter((item) => !["canceled", "incomplete_expired"].includes(item.status)),
    [data]
  );

  const createOffer = async (event: FormEvent, sendNow = false) => {
    event.preventDefault();
    setWorking(sendNow ? "create-send" : "create");
    setMessage("");

    try {
      const response = await fetch("/api/maintenance/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_offer", ...form, sendNow }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not create offer.");
      setForm(emptyForm);
      setMessage(payload.warning || (payload.sent ? "Private plan created and texted to the client." : "Private plan created. The link is ready to share."));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create offer.");
    } finally {
      setWorking("");
    }
  };

  const action = async (body: Record<string, unknown>, workingKey: string, success: string) => {
    setWorking(workingKey);
    setMessage("");
    try {
      const response = await fetch("/api/maintenance/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update maintenance.");
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update maintenance.");
    } finally {
      setWorking("");
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setMessage("Link copied.");
  };

  if (loading || !data) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#f2f2f0] text-black/40">Loading maintenance subscriptions…</main>;
  }

  const standardLink = `${origin}/maintenance`;

  return (
    <main className="min-h-screen bg-[#f2f2f0] text-[#151515]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/35">Recurring revenue</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Maintenance subscriptions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
              Sell the standard ceramic maintenance membership or make a private monthly plan for one client.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/maintenance" target="_blank" rel="noreferrer" className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/60">View public plan</a>
          </div>
        </div>

        {!data.stripeConfigured && (
          <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/[.08] p-4 text-sm text-amber-800">
            Stripe isn’t configured in this deployment, so customers can’t start recurring payments yet.
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-black/55 shadow-sm">{message}</div>
        )}

        <section className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <article className="rounded-[22px] border border-black/8 bg-[#171411] p-6 text-white shadow-[0_22px_70px_rgba(23,20,17,.12)] sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/36">Public membership</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">{data.standardPlan.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/46">{data.standardPlan.description}</p>
            <div className="mt-7 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-.06em]">{money(data.standardPlan.amountCents).replace(".00","")}</span>
              <span className="pb-1 text-sm text-white/38">/ month</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy(standardLink)} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#171411]">Copy signup link</button>
              <a href="/maintenance" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/65">Open</a>
            </div>
          </article>

          <form onSubmit={(event) => void createOffer(event, false)} className="rounded-[22px] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(23,20,17,.05)] sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/32">Client-only plan</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Create a custom subscription</h2>
            <p className="mt-2 text-sm leading-6 text-black/42">Set the client, monthly price, and what the plan is for. We’ll generate a private signup link.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-black/55">Client name
                <input required value={form.customerName} onChange={(e)=>setForm({...form,customerName:e.target.value})} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/25" placeholder="Steve" />
              </label>
              <label className="text-xs font-semibold text-black/55">Monthly price
                <div className="mt-2 flex rounded-xl border border-black/10 bg-[#fafafa] focus-within:border-black/25"><span className="px-4 py-3 text-sm text-black/35">$</span><input required min="1" step="0.01" type="number" value={form.monthlyPrice} onChange={(e)=>setForm({...form,monthlyPrice:e.target.value})} className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-sm outline-none" /></div>
              </label>
              <label className="text-xs font-semibold text-black/55">Client email
                <input type="email" value={form.customerEmail} onChange={(e)=>setForm({...form,customerEmail:e.target.value})} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/25" placeholder="client@email.com" />
              </label>
              <label className="text-xs font-semibold text-black/55">Client phone
                <input type="tel" value={form.customerPhone} onChange={(e)=>setForm({...form,customerPhone:e.target.value})} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/25" placeholder="(630) 555-0123" />
              </label>
              <label className="text-xs font-semibold text-black/55 sm:col-span-2">Plan name
                <input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/25" />
              </label>
              <label className="text-xs font-semibold text-black/55 sm:col-span-2">What’s included / note
                <textarea rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/25" placeholder="Private maintenance plan for this client…" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button disabled={Boolean(working)} type="submit" className="rounded-full bg-[#171411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
                {working === "create" ? "Creating…" : "Create private plan"}
              </button>
              <button
                disabled={Boolean(working) || !form.customerPhone.trim()}
                type="button"
                onClick={(event) => void createOffer(event as unknown as FormEvent, true)}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/60 disabled:opacity-35"
              >
                {working === "create-send" ? "Creating + sending…" : "Create + text link"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(23,20,17,.04)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/32">Subscribers</p>
              <h2 className="mt-2 text-2xl font-semibold">Recurring customers</h2>
            </div>
            <div className="rounded-full border border-black/8 bg-[#f5f4f1] px-4 py-2 text-xs font-semibold text-black/48">{activeSubscriptions.length} active / open</div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <thead className="border-b border-black/8 text-[10px] uppercase tracking-[.14em] text-black/32">
                <tr><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Monthly</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Period end</th><th className="px-3 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {data.subscriptions.map((item) => (
                  <tr key={item.id} className="border-b border-black/[.055] last:border-0">
                    <td className="px-3 py-4"><p className="font-semibold">{item.customerName}</p><p className="mt-1 text-xs text-black/35">{item.customerEmail}</p></td>
                    <td className="px-3 py-4"><p>{item.planName}</p>{item.stripeSubscriptionId && <p className="mt-1 font-mono text-[10px] text-black/28">{item.stripeSubscriptionId}</p>}</td>
                    <td className="px-3 py-4 font-semibold">{money(item.amountCents)}</td>
                    <td className="px-3 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle(item.status,item.cancelAtPeriodEnd)}`}>{item.cancelAtPeriodEnd ? "canceling" : item.status.replaceAll("_"," ")}</span></td>
                    <td className="px-3 py-4 text-black/45">{item.currentPeriodEnd ? new Date(item.currentPeriodEnd).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <a href={`/maintenance/manage/${item.manageToken}`} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/50">Manage</a>
                        {item.stripeSubscriptionId && item.status !== "canceled" && (
                          <button
                            type="button"
                            disabled={Boolean(working)}
                            onClick={() => void action(
                              { action: item.cancelAtPeriodEnd ? "resume_subscription" : "cancel_subscription", subscriptionId: item.id },
                              `sub-${item.id}`,
                              item.cancelAtPeriodEnd ? "Subscription will keep renewing." : "Subscription set to cancel after the current billing period."
                            )}
                            className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/50"
                          >
                            {item.cancelAtPeriodEnd ? "Resume" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.subscriptions.length && <div className="py-12 text-center text-sm text-black/35">No maintenance subscribers yet.</div>}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/32">Private offers</p><h2 className="mt-2 text-2xl font-semibold">Client links</h2></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.offers.map((offer) => {
              const link = `${origin}/maintenance/${offer.shareToken}`;
              return (
                <article key={offer.id} className="rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(23,20,17,.035)]">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-lg font-semibold">{offer.customerName || "Private client"}</p><p className="mt-1 text-sm text-black/40">{offer.name} · {money(offer.amountCents)}/mo</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${offer.active ? "bg-emerald-500/8 text-emerald-700" : "bg-black/5 text-black/35"}`}>{offer.active ? "Active link" : "Disabled"}</span>
                  </div>
                  <p className="mt-4 break-all rounded-xl bg-[#f5f4f1] px-3 py-2.5 font-mono text-[10px] text-black/38">{link}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void copy(link)} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/55">Copy link</button>
                    {offer.customerPhone && <button disabled={Boolean(working)} onClick={() => void action({action:"send_offer",offerId:offer.id},`send-${offer.id}`,"Offer link sent by text.")} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/55">Text link</button>}
                    <button disabled={Boolean(working)} onClick={() => void action({action:"set_offer_active",offerId:offer.id,active:!offer.active},`offer-${offer.id}`,offer.active?"Private link disabled.":"Private link re-enabled.")} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/55">{offer.active ? "Disable link" : "Enable link"}</button>
                  </div>
                </article>
              );
            })}
            {!data.offers.length && <div className="rounded-[20px] border border-dashed border-black/10 bg-white/50 p-8 text-sm text-black/35">No custom maintenance offers yet.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
