"use client";

import NumberInput from "@/components/NumberInput";
import { useEffect, useState } from "react";
import {
  DiscountCode,
  STANDALONE_HEADLIGHT_SERVICE_ID,
  isDiscountExpired,
  normalizeDiscountCode,
} from "@/lib/booking-pricing";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";

const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#6EAEC6]/60";

type ManagedDiscount = DiscountCode & { usageCount?: number };
type DiscountTargetOption = { value: string; label: string; group: string };
type ServiceOption = { id: string; title: string; price: number; pricingType: string; active: boolean };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PromoCodesPage() {
  const [discounts, setDiscounts] = useState<ManagedDiscount[]>([]);
  const [discountTargets, setDiscountTargets] = useState<DiscountTargetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const auth = authResponse.ok ? await authResponse.json() : null;
        if (!auth?.user) {
          window.location.assign("/login");
          return;
        }
        const owner = auth.user.role === "owner";
        if (!owner && !auth.permissions?.includes("pricing")) {
          window.location.assign(auth.staffAccess ? "/admin/dashboard" : "/dashboard");
          return;
        }

        const [contentResponse, discountsResponse, servicesResponse] = await Promise.all([
          fetch("/api/site-content", { cache: "no-store" }),
          fetch("/api/discounts", { cache: "no-store" }),
          fetch("/api/services", { cache: "no-store" }),
        ]);
        if (!contentResponse.ok || !discountsResponse.ok) throw new Error("Could not load your existing promo codes.");
        const content = await contentResponse.json();
        const discountsData = await discountsResponse.json();
        const serviceData: ServiceOption[] = servicesResponse.ok ? await servicesResponse.json() : [];
        const groups = [
          { key: "packages" as const, label: "Full Detailing", config: parsePricingConfig(content.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages) },
          { key: "interior" as const, label: "Interior Only", config: parsePricingConfig(content.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior) },
          { key: "exterior" as const, label: "Exterior Only", config: parsePricingConfig(content.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior) },
        ];
        const targets: DiscountTargetOption[] = groups.flatMap(group =>
          group.config.packages.map(pkg => ({
            value: `package:${group.key}:${pkg.id}`,
            label: pkg.name,
            group: group.label,
          }))
        );
        targets.push({ value: `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`, label: "Headlight Restoration", group: "Standalone" });
        if (Array.isArray(serviceData)) {
          targets.push(...serviceData
            .filter(service => service.active && service.pricingType === "fixed" && Number(service.price) > 0 && service.title.trim().toLowerCase() !== "headlight restoration")
            .map(service => ({ value: `service:${service.id}`, label: service.title, group: "Other Services" })));
        }
        if (cancelled) return;
        setDiscountTargets(targets);
        setDiscounts(Array.isArray(discountsData.discounts) ? discountsData.discounts : []);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load promo codes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateDiscount = (index: number, patch: Partial<ManagedDiscount>) => {
    setDiscounts(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const addDiscount = () => {
    const existing = new Set(discounts.map(item => normalizeDiscountCode(item.code)));
    let code = "NEWCODE";
    for (let n = 2; existing.has(code); n++) code = `NEWCODE${n}`;
    setDiscounts(current => [...current, {
      id: makeId("discount"),
      code,
      label: "",
      type: "percent",
      amount: 10,
      active: true,
      usageLimit: null,
      onePerCustomer: false,
      expiresAt: null,
      appliesTo: null,
      usageCount: 0,
    }]);
  };

  const deleteDiscount = (index: number) => {
    if (!confirm("Delete this discount code?")) return;
    setDiscounts(current => current.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (loading || saving) return;
    setMessage("");
    const cleaned: ManagedDiscount[] = discounts.map(item => ({
      ...item,
      code: normalizeDiscountCode(item.code),
      amount: Number(item.amount),
      usageLimit: item.usageLimit && item.usageLimit > 0 ? Math.floor(item.usageLimit) : null,
      expiresAt: item.expiresAt || null,
      appliesTo: item.appliesTo || null,
    }));
    if (cleaned.some(item => !item.code || !Number.isFinite(item.amount) || item.amount <= 0 || (item.type === "percent" && item.amount > 100))) {
      setMessage("Every code needs a unique name and a valid discount amount (percentages must be 100 or less).");
      return;
    }
    if (new Set(cleaned.map(item => item.code)).size !== cleaned.length) {
      setMessage("Each promo code must be unique.");
      return;
    }
    if (cleaned.some(item => item.type === "set_service_price" && !item.appliesTo)) {
      setMessage("Choose one specific service/package for every exact promo-price code before saving.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discounts: cleaned }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save promo codes.");
      setDiscounts(Array.isArray(result.discounts) ? result.discounts : []);
      setMessage("Promo codes saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save promo codes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#6EAEC6]">Owner / Marketing</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Promo Codes</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">Create and manage customer-entered booking discount codes separately from booking hours and add-on pricing. Your existing codes, usage counts, restrictions and expiration dates are kept.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/owner/promotions" className="rounded-full border border-white/15 px-4 py-3 text-sm text-white/80">Automatic Promotions</a>
            <a href="/owner/booking-settings" className="rounded-full border border-white/15 px-4 py-3 text-sm text-white/80">Booking Settings</a>
          </div>
        </div>
        {loading ? (
          <p className="mt-8 text-sm text-white/70">Loading promo codes…</p>
        ) : (
          <>
            <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Discount Codes</p>
                <h2 className="mt-2 text-2xl font-semibold">Promo code controls</h2>
                <p className="mt-2 max-w-3xl text-sm text-white/40">Choose whether a code works everywhere or only on one service/package. You can discount by percent, dollars off, or set that service to an exact promo price. Usage limits, one-per-customer rules, and expiration dates still work too.</p>
              </div>
              <div className="mt-6 grid gap-4">
                {discounts.map((item, index) => {
                  const usageCount = Number(item.usageCount || 0);
                  const limitReached = item.usageLimit !== null && usageCount >= item.usageLimit;
                  const expired = isDiscountExpired(item);
                  const targetLabel = item.appliesTo ? discountTargets.find((option) => option.value === item.appliesTo)?.label || "Specific service" : "All services";
                  return (
                    <article key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">Used {usageCount}{item.usageLimit !== null ? ` / ${item.usageLimit}` : " times"}</span>
                          {item.onePerCustomer && <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-blue-200">1 per customer</span>}
                          {item.appliesTo && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">Only: {targetLabel}</span>}
                          {item.expiresAt && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">Expires {item.expiresAt}</span>}
                          {expired && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">Expired</span>}
                          {limitReached && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">Limit reached</span>}
                        </div>
                        <button type="button" onClick={() => deleteDiscount(index)} className="rounded-xl border border-red-500/25 px-4 py-2 text-sm text-red-300">Delete</button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="text-sm text-white/55">Code<input className={`${input} mt-2 uppercase`} value={item.code} onChange={(e) => updateDiscount(index, { code: normalizeDiscountCode(e.target.value) })} placeholder="SAVE10" /></label>
                        <label className="text-sm text-white/55">Customer label<input className={`${input} mt-2`} value={item.label} onChange={(e) => updateDiscount(index, { label: e.target.value })} placeholder="10% off detailing" /></label>
                        <label className="text-sm text-white/55">Discount type<select className={`${input} mt-2`} value={item.type} onChange={(e) => updateDiscount(index, { type: e.target.value as DiscountCode["type"] })}><option value="percent">Percent off %</option><option value="fixed">Fixed dollars off $</option><option value="set_service_price">Set service price to $</option></select></label>
                        <label className="text-sm text-white/55">{item.type === "set_service_price" ? "Promo service price" : "Amount"}<NumberInput type="number" min="0" step="0.01" className={`${input} mt-2`} value={item.amount} onChange={(e) => updateDiscount(index, { amount: Number(e.target.value) })} placeholder={item.type === "set_service_price" ? "40" : undefined} /></label>
                        <label className="text-sm text-white/55 md:col-span-2">Applies to<select className={`${input} mt-2`} value={item.appliesTo || ""} onChange={(e) => updateDiscount(index, { appliesTo: e.target.value || null })}><option value="">All services and packages</option>{["Full Detailing", "Interior Only", "Exterior Only", "Standalone", "Other Services"].map((group) => { const options = discountTargets.filter((option) => option.group === group); return options.length ? <optgroup key={group} label={group}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup> : null; })}</select><span className="mt-2 block text-xs leading-5 text-white/32">Pick one service/package to prevent this code from working anywhere else.</span></label>
                        <label className="text-sm text-white/55">Total usage limit<NumberInput type="number" min="1" step="1" className={`${input} mt-2`} value={item.usageLimit ?? ""} onChange={(e) => updateDiscount(index, { usageLimit: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : null })} placeholder="Unlimited" /></label>
                        <label className="text-sm text-white/55">Expiration date<input type="date" className={`${input} mt-2`} value={item.expiresAt || ""} onChange={(e) => updateDiscount(index, { expiresAt: e.target.value || null })} /></label>
                        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white/60"><input type="checkbox" checked={item.onePerCustomer} onChange={(e) => updateDiscount(index, { onePerCustomer: e.target.checked })} /> One use per customer</label>
                        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white/60"><input type="checkbox" checked={item.active} onChange={(e) => updateDiscount(index, { active: e.target.checked })} /> Active</label>
                      </div>
                      {item.type === "set_service_price" && item.appliesTo && <p className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[.06] px-4 py-3 text-xs leading-5 text-emerald-100/80">This sets only the selected service price to ${Number(item.amount || 0).toFixed(2)}. Any customer-selected add-ons stay at their normal price.</p>}
                      {item.type === "set_service_price" && !item.appliesTo && <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[.07] px-4 py-3 text-xs leading-5 text-amber-100">Choose a specific service/package above. Exact promo-price codes cannot be saved as an all-services discount.</p>}
                    </article>
                  );
                })}
                {discounts.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/35">No discount codes yet.</p>}
              </div>
              <button type="button" onClick={addDiscount} className="mt-5 rounded-full border border-[#6EAEC6]/30 bg-[#6EAEC6]/8 px-5 py-3 text-sm font-semibold text-[#6EAEC6]">+ Create discount code</button>
            </section>
            <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#6EAEC6]/20 bg-[#0B1822]/95 p-4 shadow-2xl backdrop-blur-xl">
              <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#6EAEC6] px-7 py-3 font-semibold text-[#0B1822] disabled:opacity-50">
                {saving ? "Saving…" : "Save Promo Codes"}
              </button>
              {message && <p role="status" className="text-sm text-white/75">{message}</p>}
            </div>
          </>
        )}
        {loading && message && <p role="alert" className="mt-4 text-sm text-red-300">{message}</p>}
      </div>
    </main>
  );
}
