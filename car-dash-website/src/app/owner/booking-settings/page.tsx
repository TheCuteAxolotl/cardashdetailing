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
import {
  BOOKING_DAY_KEYS,
  BookingAvailabilityConfig,
  BookingDayKey,
  DEFAULT_BOOKING_AVAILABILITY,
  parseBookingAvailabilityConfig,
} from "@/lib/booking-availability";

const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/60";
const DAY_LABELS: Record<BookingDayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

type ManagedDiscount = DiscountCode & { usageCount?: number };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function BookingSettingsPage() {
  const [pricing, setPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [discounts, setDiscounts] = useState<ManagedDiscount[]>([]);
  const [availability, setAvailability] = useState<BookingAvailabilityConfig>(DEFAULT_BOOKING_AVAILABILITY);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [canManagePricing, setCanManagePricing] = useState(true);
  const [canManageAvailability, setCanManageAvailability] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = authResponse.ok ? await authResponse.json() : null;
        if (!authData?.user) {
          window.location.assign("/login");
          return;
        }

        const owner = authData.user.role === "owner";
        const pricingAccess = owner || Boolean(authData.permissions?.includes("pricing"));
        const bookingAccess = owner || Boolean(authData.permissions?.includes("bookings"));
        if (!pricingAccess && !bookingAccess) {
          window.location.assign(authData.staffAccess ? "/admin/dashboard" : "/dashboard");
          return;
        }
        setCanManagePricing(pricingAccess);
        setCanManageAvailability(bookingAccess);

        const [contentResponse, discountsResponse, availabilityResponse] = await Promise.all([
          pricingAccess ? fetch("/api/site-content", { cache: "no-store" }) : Promise.resolve(null),
          pricingAccess ? fetch("/api/discounts", { cache: "no-store" }) : Promise.resolve(null),
          bookingAccess ? fetch("/api/availability/settings", { cache: "no-store" }) : Promise.resolve(null),
        ]);

        if (contentResponse?.ok) {
          const content = await contentResponse.json();
          setPricing(parseBookingPricingConfig(content?.bookingPricingConfig));
        }
        if (discountsResponse?.ok) {
          const discountData = await discountsResponse.json();
          setDiscounts(Array.isArray(discountData?.discounts) ? discountData.discounts : []);
        }
        if (availabilityResponse?.ok) {
          const availabilityData = await availabilityResponse.json();
          setAvailability(parseBookingAvailabilityConfig(availabilityData?.config));
        }
      } catch {
        setMessage("Could not load booking settings.");
      }
    })();
  }, []);

  const updateWeeklyDay = (day: BookingDayKey, patch: Partial<BookingAvailabilityConfig["weekly"][BookingDayKey]>) => {
    setAvailability((current) => ({
      ...current,
      weekly: {
        ...current.weekly,
        [day]: { ...current.weekly[day], ...patch },
      },
    }));
  };

  const updateWeeklySlot = (day: BookingDayKey, index: number, value: string) => {
    updateWeeklyDay(day, {
      slots: availability.weekly[day].slots.map((slot, i) => (i === index ? value : slot)),
    });
  };

  const addWeeklySlot = (day: BookingDayKey) => {
    updateWeeklyDay(day, { slots: [...availability.weekly[day].slots, "09:00"] });
  };

  const removeWeeklySlot = (day: BookingDayKey, index: number) => {
    updateWeeklyDay(day, { slots: availability.weekly[day].slots.filter((_, i) => i !== index) });
  };

  const addDateOverride = () => {
    setAvailability((current) => ({
      ...current,
      overrides: [...current.overrides, { date: "", closed: true, slots: [], note: "" }],
    }));
  };

  const updateDateOverride = (index: number, patch: Partial<BookingAvailabilityConfig["overrides"][number]>) => {
    setAvailability((current) => ({
      ...current,
      overrides: current.overrides.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addOverrideSlot = (index: number) => {
    const item = availability.overrides[index];
    updateDateOverride(index, { slots: [...item.slots, "09:00"] });
  };

  const updateOverrideSlot = (overrideIndex: number, slotIndex: number, value: string) => {
    const item = availability.overrides[overrideIndex];
    updateDateOverride(overrideIndex, { slots: item.slots.map((slot, i) => (i === slotIndex ? value : slot)) });
  };

  const removeOverrideSlot = (overrideIndex: number, slotIndex: number) => {
    const item = availability.overrides[overrideIndex];
    updateDateOverride(overrideIndex, { slots: item.slots.filter((_, i) => i !== slotIndex) });
  };

  const removeDateOverride = (index: number) => {
    setAvailability((current) => ({ ...current, overrides: current.overrides.filter((_, i) => i !== index) }));
  };

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
      const requests: Promise<Response>[] = [];

      if (canManageAvailability) {
        requests.push(fetch("/api/availability/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: availability }),
        }));
      }

      let cleanedPricing = pricing;
      if (canManagePricing) {
        cleanedPricing = {
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

        requests.push(fetch("/api/site-content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingPricingConfig: JSON.stringify(cleanedPricing) }),
        }));
        requests.push(fetch("/api/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discounts: cleanedDiscounts }),
        }));
      }

      const responses = await Promise.all(requests);
      if (responses.some((response) => !response.ok)) throw new Error("Save failed");

      if (canManageAvailability) {
        const availabilityResponse = responses[0];
        const saved = await availabilityResponse.json();
        setAvailability(parseBookingAvailabilityConfig(saved.config));
      }

      if (canManagePricing) {
        const discountResponse = responses[responses.length - 1];
        const savedDiscounts = await discountResponse.json();
        setPricing(cleanedPricing);
        setDiscounts(savedDiscounts.discounts || []);
      }
      setMessage("Booking settings saved.");
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
            <h1 className="mt-2 text-4xl font-semibold">Booking Settings</h1>
            <p className="mt-2 max-w-3xl text-white/40">Set the days and times customers can book, block off dates, and manage booking add-ons and discount codes.</p>
          </div>
          <div className="flex gap-2">
            <a href="/owner/bookings" className="rounded-full border border-[#FF2D2D]/30 bg-[#FF2D2D]/10 px-5 py-3 text-sm text-[#FF2D2D]">View Bookings</a>
            <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
          </div>
        </div>

        {canManageAvailability && (
          <>
            <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Weekly Availability</p>
                <h2 className="mt-2 text-2xl font-semibold">Days and times customers can book</h2>
                <p className="mt-2 max-w-3xl text-sm text-white/40">Turn a day off if you normally do not work that day. Add or remove times for each day. A time disappears from the customer booking form as soon as another active booking takes it.</p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {BOOKING_DAY_KEYS.map((day) => {
                  const dayConfig = availability.weekly[day];
                  return (
                    <article key={day} className={`rounded-2xl border p-4 ${dayConfig.enabled ? "border-white/10 bg-black/25" : "border-white/5 bg-black/10 opacity-70"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{DAY_LABELS[day]}</h3>
                          <p className="mt-1 text-xs text-white/35">{dayConfig.enabled ? `${dayConfig.slots.length} bookable time${dayConfig.slots.length === 1 ? "" : "s"}` : "Not available"}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-white/60">
                          <input type="checkbox" checked={dayConfig.enabled} onChange={(e) => updateWeeklyDay(day, { enabled: e.target.checked })} /> Available
                        </label>
                      </div>

                      {dayConfig.enabled && (
                        <div className="mt-4 space-y-2">
                          {dayConfig.slots.map((slot, index) => (
                            <div key={`${day}-${index}`} className="flex gap-2">
                              <input type="time" className={input} value={slot} onChange={(e) => updateWeeklySlot(day, index, e.target.value)} />
                              <button type="button" onClick={() => removeWeeklySlot(day, index)} className="rounded-xl border border-red-500/25 px-3 text-sm text-red-300">Remove</button>
                            </div>
                          ))}
                          {dayConfig.slots.length === 0 && <p className="text-xs text-amber-200">This day is on, but it has no times, so customers still cannot book it.</p>}
                          <button type="button" onClick={() => addWeeklySlot(day)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60">+ Add time</button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Date Overrides</p>
                  <h2 className="mt-2 text-2xl font-semibold">Days off and special hours</h2>
                  <p className="mt-2 max-w-3xl text-sm text-white/40">Use this for a specific day you are unavailable, a vacation day, or a day where your hours are different from your normal weekly schedule.</p>
                </div>
                <button type="button" onClick={addDateOverride} className="rounded-full border border-[#FF2D2D]/30 bg-[#FF2D2D]/8 px-5 py-3 text-sm font-semibold text-[#FF2D2D]">+ Add date</button>
              </div>

              <div className="mt-6 space-y-4">
                {availability.overrides.map((item, index) => (
                  <article key={`${item.date}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto] md:items-end">
                      <label className="text-sm text-white/55">Date<input type="date" className={`${input} mt-2`} value={item.date} onChange={(e) => updateDateOverride(index, { date: e.target.value })} /></label>
                      <label className="text-sm text-white/55">Note (optional)<input className={`${input} mt-2`} value={item.note || ""} onChange={(e) => updateDateOverride(index, { note: e.target.value })} placeholder="Vacation, class, personal day…" /></label>
                      <label className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-4 text-sm text-white/60"><input type="checkbox" checked={item.closed} onChange={(e) => updateDateOverride(index, { closed: e.target.checked })} /> Entire day off</label>
                      <button type="button" onClick={() => removeDateOverride(index)} className="h-12 rounded-xl border border-red-500/25 px-4 text-sm text-red-300">Delete</button>
                    </div>

                    {!item.closed && (
                      <div className="mt-4">
                        <p className="text-xs text-white/40">Custom available times for this date</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {item.slots.map((slot, slotIndex) => (
                            <div key={`${index}-${slotIndex}`} className="flex gap-2">
                              <input type="time" className={input} value={slot} onChange={(e) => updateOverrideSlot(index, slotIndex, e.target.value)} />
                              <button type="button" onClick={() => removeOverrideSlot(index, slotIndex)} className="rounded-xl border border-red-500/25 px-3 text-xs text-red-300">×</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => addOverrideSlot(index)} className="mt-3 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60">+ Add time</button>
                      </div>
                    )}
                  </article>
                ))}
                {availability.overrides.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/35">No special dates yet. Your normal weekly schedule will be used.</p>}
              </div>
            </section>
          </>
        )}

        {canManagePricing && (
          <>
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
          </>
        )}

        <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#FF2D2D]/20 bg-[#0D0D0D]/95 p-4 shadow-2xl backdrop-blur-xl">
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#FF2D2D] px-7 py-3 font-semibold text-[#0D0D0D] disabled:opacity-50">{saving ? "Saving…" : "Save Booking Settings"}</button>
          {message && <p className="text-sm text-white/55">{message}</p>}
        </div>
      </div>
    </main>
  );
}
