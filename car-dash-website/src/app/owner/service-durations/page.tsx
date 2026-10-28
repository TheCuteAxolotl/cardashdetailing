"use client";

import NumberInput from "@/components/NumberInput";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_BOOKING_PRICING, parseBookingPricingConfig, STANDALONE_HEADLIGHT_SERVICE_ID, type BookingPricingConfig } from "@/lib/booking-pricing";
import { recommendedAddOnMinutes, recommendedServiceMinutes } from "@/lib/booking-duration";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";

type DurationTarget = { key: string; label: string; group: string; name: string };
type ServiceOption = { id: string; title: string; active: boolean };
const input = "w-24 rounded-xl border border-white/20 bg-[#242424] px-3 py-2.5 text-base text-white outline-none focus:border-[#d6b779]";
const groups = ["Full Detailing", "Interior Only", "Exterior Only", "Standalone", "Other Services"];

function normalizeMinutes(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 15 && number <= 960 ? Math.ceil(number / 15) * 15 : fallback;
}

export default function ServiceDurationsPage() {
  const [pricing, setPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [targets, setTargets] = useState<DurationTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"services" | "addons">("services");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = authResponse.ok ? await authResponse.json() : null;
        if (!authData?.user) { window.location.assign("/login"); return; }
        if (authData.user.role !== "owner" && !authData.permissions?.includes("pricing")) {
          window.location.assign(authData.staffAccess ? "/admin/dashboard" : "/dashboard");
          return;
        }
        const [contentResponse, servicesResponse] = await Promise.all([
          fetch("/api/site-content", { cache: "no-store" }),
          fetch("/api/services", { cache: "no-store" }),
        ]);
        if (!contentResponse.ok) throw new Error("Unable to load current service durations.");
        const content = await contentResponse.json();
        const services: ServiceOption[] = servicesResponse.ok ? await servicesResponse.json() : [];
        const config = parseBookingPricingConfig(content?.bookingPricingConfig);
        const packageGroups = [
          { key: "packages" as const, label: "Full Detailing", config: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages) },
          { key: "interior" as const, label: "Interior Only", config: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior) },
          { key: "exterior" as const, label: "Exterior Only", config: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior) },
        ];
        const allTargets: DurationTarget[] = packageGroups.flatMap(group =>
          group.config.packages.flatMap(pkg =>
            (["coupe", "sedan", "truckSuv"] as const).map((vehicle, i) => ({
              key: `package:${group.key}:${pkg.id}:${vehicle}`,
              label: `${pkg.name} — ${["Sedan", "SUV / CRV", "Truck / 3-row SUV"][i]}`,
              name: pkg.name, group: group.label,
            }))
          )
        );
        allTargets.push({ key: `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`, label: "Headlight Restoration", name: "Headlight Restoration", group: "Standalone" });
        if (Array.isArray(services)) {
          allTargets.push(...services.map(service => ({
            key: `service:${service.id}`, label: `${service.title}${service.active ? "" : " (inactive)"}`,
            name: service.title, group: "Other Services",
          })));
        }
        if (cancelled) return;
        setTargets(allTargets);
        setPricing(config);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load service durations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalServices = useMemo(() => targets.length, [targets]);
  const updateService = (key: string, minutes: number) => {
    setPricing(current => ({ ...current, serviceDurations: { ...current.serviceDurations, [key]: minutes } }));
    setDirty(true);
    setMessage("");
  };
  const updateAddOn = (id: string, minutes: number) => {
    setPricing(current => ({ ...current, addOns: current.addOns.map(item => item.id === id ? { ...item, durationMinutes: minutes } : item) }));
    setDirty(true);
    setMessage("");
  };
  const save = async () => {
    if (saving || loading || !dirty) return;
    setSaving(true);
    setMessage("");
    try {
      // Merge only duration fields into the latest persisted pricing so editing this
      // page cannot accidentally roll back changes made in Booking Settings.
      const currentResponse = await fetch("/api/site-content", { cache: "no-store" });
      if (!currentResponse.ok) throw new Error("Could not read the current booking configuration.");
      const content = await currentResponse.json();
      const latest = parseBookingPricingConfig(content?.bookingPricingConfig);
      const times = Object.fromEntries(Object.entries(pricing.serviceDurations).map(([key, minutes]) => [
        key, normalizeMinutes(minutes, recommendedServiceMinutes(key, targets.find(target => target.key === key)?.name || "Detail"))
      ]));
      const durationById = new Map(pricing.addOns.map(item => [item.id, item.durationMinutes ?? recommendedAddOnMinutes(item.name, item.id)]));
      const savedConfig: BookingPricingConfig = {
        ...latest,
        headlightStandaloneDuration: normalizeMinutes(
          times[`service:${STANDALONE_HEADLIGHT_SERVICE_ID}`] ?? pricing.headlightStandaloneDuration, 90
        ),
        serviceDurations: { ...latest.serviceDurations, ...times },
        addOns: latest.addOns.map(item => ({
          ...item,
          durationMinutes: normalizeMinutes(durationById.get(item.id), recommendedAddOnMinutes(item.name, item.id)),
        })),
      };
      const response = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingPricingConfig: JSON.stringify(savedConfig) }),
      });
      if (!response.ok) throw new Error("Could not save service durations.");
      setPricing(savedConfig);
      setDirty(false);
      setMessage("Service and add-on durations saved. New booking slots now use these times.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save service durations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#101010] px-4 py-8 text-[#f4efe5] sm:px-7 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e5c995]">Owner / Operations</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Service Time Durations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#cec9c1]">Set appointment lengths for every detail package, vehicle size, standalone service and add-on. These minutes automatically determine the bookable time your calendar reserves.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/owner/booking-settings" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-[#f4efe5]">Booking Settings</a>
            <a href="/owner/dashboard" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-[#f4efe5]">Dashboard</a>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab("services")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${tab === "services" ? "border-[#d6b779] bg-[#d6b779] text-[#101010]" : "border-white/20 bg-[#242424] text-[#f4efe5]"}`}>Services ({totalServices})</button>
          <button type="button" onClick={() => setTab("addons")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${tab === "addons" ? "border-[#d6b779] bg-[#d6b779] text-[#101010]" : "border-white/20 bg-[#242424] text-[#f4efe5]"}`}>Add-ons ({pricing.addOns.length})</button>
        </div>

        {loading ? <p className="mt-8 text-sm text-[#cec9c1]">Loading current durations…</p> : <>
          {tab === "services" ? (
            <div className="mt-6 space-y-4">
              {groups.map(group => {
                const values = targets.filter(target => target.group === group);
                return values.length > 0 ? <details key={group} open={group === "Full Detailing" ? true : undefined} className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-4 sm:p-5">
                  <summary className="cursor-pointer text-lg font-semibold text-[#f4efe5]">{group} <span className="text-sm font-normal text-[#b9b5ad]">({values.length} options)</span></summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {values.map(target => {
                      const duration = pricing.serviceDurations[target.key] ?? recommendedServiceMinutes(target.key, target.name);
                      return <label key={target.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#242424] p-3 text-sm text-[#f4efe5]">
                        <span className="min-w-0 flex-1">{target.label}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <NumberInput type="number" min="15" max="960" step="15" className={input} value={duration} onChange={event => updateService(target.key, Number(event.target.value))} />
                          <span className="text-xs text-[#cec9c1]">min</span>
                        </span>
                      </label>;
                    })}
                  </div>
                </details> : null;
              })}
            </div>
          ) : (
            <section className="mt-6 rounded-2xl border border-white/15 bg-[#1c1c1c] p-4 sm:p-5">
              <h2 className="text-xl font-semibold">Add-on time estimates</h2>
              <p className="mt-2 text-sm leading-6 text-[#cec9c1]">Add-on minutes are added to the selected service's time. To rename an add-on or change its price, use Booking Settings.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {pricing.addOns.map(item => <label key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#242424] p-3 text-sm text-[#f4efe5]">
                  <span className="min-w-0 flex-1">{item.name}{!item.active ? <span className="block text-xs text-[#cec9c1]">Inactive</span> : null}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <NumberInput type="number" min="15" max="960" step="15" className={input} value={item.durationMinutes ?? recommendedAddOnMinutes(item.name, item.id)} onChange={event => updateAddOn(item.id, Number(event.target.value))} />
                    <span className="text-xs text-[#cec9c1]">min</span>
                  </span>
                </label>)}
              </div>
              {pricing.addOns.length === 0 && <p className="mt-4 text-sm text-[#b9b5ad]">No add-ons are configured.</p>}
            </section>
          )}

          <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#d6b779]/30 bg-[#191919]/95 p-4 shadow-2xl backdrop-blur-xl">
            <button type="button" disabled={saving || !dirty} onClick={save} className="rounded-xl bg-[#d6b779] px-6 py-3 font-semibold text-[#101010] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save Time Durations"}</button>
            {message && <p role="status" className="text-sm text-[#f4efe5]">{message}</p>}
            <p className="w-full text-xs leading-5 text-[#b9b5ad]">15–960 minutes per item. Existing booked appointments retain their originally reserved time; changes apply to new bookings.</p>
          </div>
        </>}
        {loading && message && <p role="alert" className="mt-4 text-sm text-red-300">{message}</p>}
      </div>
    </main>
  );
}
