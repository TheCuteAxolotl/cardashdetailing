"use client";

import { useEffect, useState } from "react";
import {
  BookingAddOn,
  BookingPricingConfig,
  DEFAULT_BOOKING_PRICING,
  DiscountCode,
  isDiscountExpired,
  normalizeDiscountCode,
  parseBookingPricingConfig,
} from "@/lib/booking-pricing";

const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/60";

type ManagedDiscount = DiscountCode & { usageCount?: number };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function BookingSettingsPage() {
  const [pricing, setPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [discounts, setDiscounts] = useState<ManagedDiscount[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = authResponse.ok ? await authResponse.json() : null;
        if (!authData?.user || authData.user.role !== "owner") {
          window.location.assign(authData?.user ? "/" : "/login");
          return;
        }
        const [contentResponse, discountsResponse] = await Promise.all([
          fetch("/api/site-content", { cache: "no-store" }),
          fetch("/api/discounts", { cache: "no-store" }),
        ]);
        const content = contentResponse.ok ? await contentResponse.json() : {};
        const discountData = discountsResponse.ok ? await discountsResponse.json() : {};
        setPricing(parseBookingPricingConfig(content?.bookingPricingConfig));
        setDiscounts(Array.isArray(discountData?.discounts) ? discountData.discounts : []);
      } catch {
        setMessage("Could not load booking settings.");
      }
    })();
  }, []);

  const updateAddOn = (index: number, patch: Partial<BookingAddOn>) => {
    setPricing((current) => ({ ...current, addOns: current.addOns.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  };

  const addAddOn = () => {
    setPricing((current) => ({
      ...current,
      addOns: [...current.addOns, { id: makeId("addon"), name: "New Add-On", price: 25, active: true }],
    }));
  };

  const deleteAddOn = (index: number) => {
    if (!confirm("Delete this add-on?")) return;
    setPricing((current) => ({ ...current, addOns: current.addOns.filter((_, i) => i !== index) }));
  };

  const updateDiscount = (index: number, patch: Partial<ManagedDiscount>) => {
    setDiscounts((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addDiscount = () => {
    setDiscounts((current) => [
      ...current,
      {
        id: makeId("discount"),
        code: "NEWCODE",
        label: "",
        type: "percent",
        amount: 10,
        active: true,
        usageLimit: null,
        onePerCustomer: false,
        expiresAt: null,
        usageCount: 0,
      },
    ]);
  };

  const deleteDiscount = (index: number) => {
    if (!confirm("Delete this discount code?")) return;
    setDiscounts((current) => current.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const cleanedPricing: BookingPricingConfig = {
        headlightStandalonePrice: Math.max(0, Number(pricing.headlightStandalonePrice || 0)),
        addOns: pricing.addOns.map((item, index) => ({
          ...item,
          id: item.id || makeId(`addon-${index + 1}`),
          name: item.name.trim() || `Add-On ${index + 1}`,
          price: Math.max(0, Number(item.price || 0)),
        })),
      };
      const cleanedDiscounts = discounts.map((item) => ({
        ...item,
        code: normalizeDiscountCode(item.code),
        amount: Math.max(0, Number(item.amount || 0)),
        usageLimit: item.usageLimit && item.usageLimit > 0 ? Math.floor(item.usageLimit) : null,
        expiresAt: item.expiresAt || null,
      }));

      const [pricingResponse, discountResponse] = await Promise.all([
        fetch("/api/site-content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingPricingConfig: JSON.stringify(cleanedPricing) }),
        }),
        fetch("/api/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discounts: cleanedDiscounts }),
        }),
      ]);

      if (!pricingResponse.ok || !discountResponse.ok) throw new Error("Save failed");
      const savedDiscounts = await discountResponse.json();
      setPricing(cleanedPricing);
      setDiscounts(savedDiscounts.discounts || []);
      setMessage("Booking add-ons and discount codes saved.");
    } catch {
      setMessage("Could not save booking settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Owner</p>
            <h1 className="mt-2 text-4xl font-semibold">Add-Ons & Discounts</h1>
            <p className="mt-2 max-w-3xl text-white/40">Control booking add-on prices, the standalone headlight price, and discount codes customers can apply at checkout.</p>
          </div>
          <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
        </div>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Car Detailing Add-Ons</p><h2 className="mt-2 text-2xl font-semibold">Booking add-ons</h2><p className="mt-2 text-sm text-white/40">These prices appear in the booking form and are added to the exact total.</p></div>
            <label className="text-sm text-white/55">Headlight Restoration booked alone
              <input type="number" min="0" step="1" className={`${input} mt-2 w-56`} value={pricing.headlightStandalonePrice} onChange={(e) => setPricing((current) => ({ ...current, headlightStandalonePrice: Number(e.target.value) }))} />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            {pricing.addOns.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_150px_auto_auto] md:items-end">
                <label className="text-sm text-white/55">Add-on name<input className={`${input} mt-2`} value={item.name} onChange={(e) => updateAddOn(index, { name: e.target.value })} /></label>
                <label className="text-sm text-white/55">Price<input type="number" min="0" step="1" className={`${input} mt-2`} value={item.price} onChange={(e) => updateAddOn(index, { price: Number(e.target.value) })} /></label>
                <label className="flex h-12 items-center gap-2 text-sm text-white/60"><input type="checkbox" checked={item.active} onChange={(e) => updateAddOn(index, { active: e.target.checked })} /> Active</label>
                <button type="button" onClick={() => deleteAddOn(index)} className="h-12 rounded-xl border border-red-500/25 px-4 text-sm text-red-300">Delete</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAddOn} className="mt-5 rounded-full border border-[#FF2D2D]/30 bg-[#FF2D2D]/8 px-5 py-3 text-sm font-semibold text-[#FF2D2D]">+ Add add-on</button>
        </section>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Discount Codes</p>
            <h2 className="mt-2 text-2xl font-semibold">Promo code controls</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/40">Set an optional total usage limit, restrict a code to one booking per customer, and choose an expiration date. Leave the usage limit or expiration blank for no limit.</p>
          </div>
          <div className="mt-6 grid gap-4">
            {discounts.map((item, index) => {
              const usageCount = Number(item.usageCount || 0);
              const limitReached = item.usageLimit !== null && usageCount >= item.usageLimit;
              const expired = isDiscountExpired(item);
              return (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">Used {usageCount}{item.usageLimit !== null ? ` / ${item.usageLimit}` : " times"}</span>
                      {item.onePerCustomer && <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-blue-200">1 per customer</span>}
                      {item.expiresAt && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">Expires {item.expiresAt}</span>}
                      {expired && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">Expired</span>}
                      {limitReached && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">Limit reached</span>}
                    </div>
                    <button type="button" onClick={() => deleteDiscount(index)} className="rounded-xl border border-red-500/25 px-4 py-2 text-sm text-red-300">Delete</button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="text-sm text-white/55">Code<input className={`${input} mt-2 uppercase`} value={item.code} onChange={(e) => updateDiscount(index, { code: normalizeDiscountCode(e.target.value) })} placeholder="SAVE10" /></label>
                    <label className="text-sm text-white/55">Customer label<input className={`${input} mt-2`} value={item.label} onChange={(e) => updateDiscount(index, { label: e.target.value })} placeholder="10% off detailing" /></label>
                    <label className="text-sm text-white/55">Discount type<select className={`${input} mt-2`} value={item.type} onChange={(e) => updateDiscount(index, { type: e.target.value as "percent" | "fixed" })}><option value="percent">Percent %</option><option value="fixed">Fixed $</option></select></label>
                    <label className="text-sm text-white/55">Amount<input type="number" min="0" step="0.01" className={`${input} mt-2`} value={item.amount} onChange={(e) => updateDiscount(index, { amount: Number(e.target.value) })} /></label>
                    <label className="text-sm text-white/55">Total usage limit<input type="number" min="1" step="1" className={`${input} mt-2`} value={item.usageLimit ?? ""} onChange={(e) => updateDiscount(index, { usageLimit: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : null })} placeholder="Unlimited" /></label>
                    <label className="text-sm text-white/55">Expiration date<input type="date" className={`${input} mt-2`} value={item.expiresAt || ""} onChange={(e) => updateDiscount(index, { expiresAt: e.target.value || null })} /></label>
                    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white/60"><input type="checkbox" checked={item.onePerCustomer} onChange={(e) => updateDiscount(index, { onePerCustomer: e.target.checked })} /> One use per customer</label>
                    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white/60"><input type="checkbox" checked={item.active} onChange={(e) => updateDiscount(index, { active: e.target.checked })} /> Active</label>
                  </div>
                </article>
              );
            })}
            {discounts.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/35">No discount codes yet.</p>}
          </div>
          <button type="button" onClick={addDiscount} className="mt-5 rounded-full border border-[#FF2D2D]/30 bg-[#FF2D2D]/8 px-5 py-3 text-sm font-semibold text-[#FF2D2D]">+ Create discount code</button>
        </section>

        <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#FF2D2D]/20 bg-[#0D0D0D]/95 p-4 shadow-2xl backdrop-blur-xl">
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#FF2D2D] px-7 py-3 font-semibold text-[#0D0D0D] disabled:opacity-50">{saving ? "Saving…" : "Save Add-Ons & Discounts"}</button>
          {message && <p className="text-sm text-white/55">{message}</p>}
        </div>
      </div>
    </main>
  );
}
