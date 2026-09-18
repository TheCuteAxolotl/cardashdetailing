"use client";

import { useEffect, useState } from "react";
import {
  BookingAddOn,
  BookingPricingConfig,
  DEFAULT_BOOKING_PRICING,
  DiscountCode,
  STANDALONE_HEADLIGHT_SERVICE_ID,
  isDiscountExpired,
  normalizeDiscountCode,
  parseBookingPricingConfig,
} from "@/lib/booking-pricing";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import {
  BOOKING_DAY_KEYS,
  BookingAvailabilityConfig,
  BookingDayKey,
  DEFAULT_BOOKING_AVAILABILITY,
  parseBookingAvailabilityConfig,
} from "@/lib/booking-availability";

const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#6EAEC6]/60";
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
type DiscountTargetOption = { value: string; label: string; group: string };
type ServiceOption = { id: string; title: string; price: number; pricingType: string; active: boolean };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function BookingSettingsPage() {
  const [pricing, setPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [discounts, setDiscounts] = useState<ManagedDiscount[]>([]);
  const [discountTargets, setDiscountTargets] = useState<DiscountTargetOption[]>([]);
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

        const [contentResponse, discountsResponse, availabilityResponse, servicesResponse] = await Promise.all([
          pricingAccess ? fetch("/api/site-content", { cache: "no-store" }) : Promise.resolve(null),
          pricingAccess ? fetch("/api/discounts", { cache: "no-store" }) : Promise.resolve(null),
          bookingAccess ? fetch("/api/availability/settings", { cache: "no-store" }) : Promise.resolve(null),
          pricingAccess ? fetch("/api/services", { cache: "no-store" }) : Promise.resolve(null),
        ]);

        if (contentResponse?.ok) {
          const content = await contentResponse.json();
          const loadedBookingPricing = parseBookingPricingConfig(content?.bookingPricingConfig);
          setPricing(loadedBookingPricing);

          const packageGroups = [
            { key: "packages" as const, label: "Full Detailing", config: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages) },
            { key: "interior" as const, label: "Interior Only", config: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior) },
            { key: "exterior" as const, label: "Exterior Only", config: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior) },
          ];
          const packageTargets: DiscountTargetOption[] = packageGroups.flatMap((group) =>
            group.config.packages.map((pkg) => ({
              value: `package:${group.key}:${pkg.id}`,
              label: pkg.name,
              group: group.label,
            }))
          );
          const serviceData: ServiceOption[] = servicesResponse?.ok ? await servicesResponse.json() : [];
          const serviceTargets: DiscountTargetOption[] = Array.isArray(serviceData)
            ? serviceData
                .filter((service) => service.active && service.pricingType === "fixed" && Number(service.price) > 0 && service.title.trim().toLowerCase() !== "headlight restoration")
                .map((service) => ({ value: `service:${service.id}`, label: service.title, group: "Other Services" }))
            : [];
          setDiscountTargets([
            ...packageTargets,
            { value: `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`, label: "Headlight Restoration", group: "Standalone" },
            ...serviceTargets,
          ]);
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
        appliesTo: null,
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
          appliesTo: item.appliesTo || null,
        }));
        if (cleanedDiscounts.some((item) => item.type === "set_service_price" && !item.appliesTo)) {
          setMessage("Choose one specific service/package for every exact promo-price code before saving.");
          return;
        }

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
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#6EAEC6]">Owner</p>
            <h1 className="mt-2 text-4xl font-semibold">Booking Settings</h1>
            <p className="mt-2 max-w-3xl text-white/40">Set the days and times customers can book, block off dates, and manage booking add-ons and discount codes.</p>
          </div>
          <div className="flex gap-2">
            <a href="/owner/bookings" className="rounded-full border border-[#6EAEC6]/30 bg-[#6EAEC6]/10 px-5 py-3 text-sm text-[#6EAEC6]">View Bookings</a>
            <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
          </div>
        </div>

        {canManageAvailability && (
          <>
            <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[.025] p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Weekly Availability</p>
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
                  <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Date Overrides</p>
                  <h2 className="mt-2 text-2xl font-semibold">Days off and special hours</h2>
                  <p className="mt-2 max-w-3xl text-sm text-white/40">Use this for a specific day you are unavailable, a vacation day, or a day where your hours are different from your normal weekly schedule.</p>
                </div>
                <button type="button" onClick={addDateOverride} className="rounded-full border border-[#6EAEC6]/30 bg-[#6EAEC6]/8 px-5 py-3 text-sm font-semibold text-[#6EAEC6]">+ Add date</button>
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
                <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Car Detailing Add-Ons</p><h2 className="mt-2 text-2xl font-semibold">Booking add-ons</h2><p className="mt-2 text-sm text-white/40">These prices appear in the booking form and are added to the exact total.</p></div>
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
              <button type="button" onClick={addAddOn} className="mt-5 rounded-full border border-[#6EAEC6]/30 bg-[#6EAEC6]/8 px-5 py-3 text-sm font-semibold text-[#6EAEC6]">+ Add add-on</button>
            </section>

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
                        <label className="text-sm text-white/55">{item.type === "set_service_price" ? "Promo service price" : "Amount"}<input type="number" min="0" step="0.01" className={`${input} mt-2`} value={item.amount} onChange={(e) => updateDiscount(index, { amount: Number(e.target.value) })} placeholder={item.type === "set_service_price" ? "40" : undefined} /></label>
                        <label className="text-sm text-white/55 md:col-span-2">Applies to<select className={`${input} mt-2`} value={item.appliesTo || ""} onChange={(e) => updateDiscount(index, { appliesTo: e.target.value || null })}><option value="">All services and packages</option>{["Full Detailing", "Interior Only", "Exterior Only", "Standalone", "Other Services"].map((group) => { const options = discountTargets.filter((option) => option.group === group); return options.length ? <optgroup key={group} label={group}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup> : null; })}</select><span className="mt-2 block text-xs leading-5 text-white/32">Pick one service/package to prevent this code from working anywhere else.</span></label>
                        <label className="text-sm text-white/55">Total usage limit<input type="number" min="1" step="1" className={`${input} mt-2`} value={item.usageLimit ?? ""} onChange={(e) => updateDiscount(index, { usageLimit: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : null })} placeholder="Unlimited" /></label>
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
          </>
        )}

        <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#6EAEC6]/20 bg-[#0B1822]/95 p-4 shadow-2xl backdrop-blur-xl">
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#6EAEC6] px-7 py-3 font-semibold text-[#0B1822] disabled:opacity-50">{saving ? "Saving…" : "Save Booking Settings"}</button>
          {message && <p className="text-sm text-white/55">{message}</p>}
        </div>
      </div>
    </main>
  );
}
