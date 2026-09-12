"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PRICING_PAGES, PricingPageConfig, PricingPackage, VehicleClass, parsePricingConfig } from "@/lib/pricing-config";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

type Kind = "packages" | "exterior" | "interior";

type ConfigMap = Record<Kind, PricingPageConfig>;

const keys: Record<Kind, keyof typeof SITE_DEFAULTS> = {
  packages: "pricingPackagesConfig",
  exterior: "pricingExteriorConfig",
  interior: "pricingInteriorConfig",
};

const labels: Record<Kind, string> = {
  packages: "Car Detailing Packages",
  exterior: "Exterior Pricing",
  interior: "Interior Pricing",
};

const routes: Record<Kind, string> = {
  packages: "/car-detailing-packages",
  exterior: "/exterior-detailing",
  interior: "/interior-detailing",
};

const input = "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF2D2D]/55";

function newPackage(index: number): PricingPackage {
  return {
    id: `package-${Date.now()}-${index}`,
    tier: "New Package",
    name: "New Detailing Package",
    description: "Describe who this package is for and what makes it different.",
    badge: "",
    featured: false,
    ctaLabel: "Book This Package",
    prices: { coupe: 0, sedan: 0, truckSuv: 0 },
    features: ["Included service"],
  };
}

export default function OwnerPricingPages() {
  const [active, setActive] = useState<Kind>("packages");
  const [configs, setConfigs] = useState<ConfigMap>({
    packages: DEFAULT_PRICING_PAGES.packages,
    exterior: DEFAULT_PRICING_PAGES.exterior,
    interior: DEFAULT_PRICING_PAGES.interior,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => r.json())
      .then((content) => setConfigs({
        packages: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
        exterior: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
        interior: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
      }))
      .catch(() => setMessage("Could not load pricing pages."));
  }, []);

  const config = configs[active];
  const setConfig = (next: PricingPageConfig) => setConfigs((current) => ({ ...current, [active]: next }));

  const updatePackage = (index: number, updates: Partial<PricingPackage>) => {
    const packages = [...config.packages];
    packages[index] = { ...packages[index], ...updates };
    setConfig({ ...config, packages });
  };

  const updatePrice = (index: number, vehicle: VehicleClass, value: string) => {
    const pkg = config.packages[index];
    updatePackage(index, { prices: { ...pkg.prices, [vehicle]: Number(value || 0) } });
  };

  const updateFeatures = (index: number, value: string) => {
    updatePackage(index, { features: value.split("\n").map((x) => x.trim()).filter(Boolean) });
  };

  const addPackage = () => setConfig({ ...config, packages: [...config.packages, newPackage(config.packages.length)] });

  const removePackage = (index: number) => {
    if (!confirm("Delete this package card?")) return;
    setConfig({ ...config, packages: config.packages.filter((_, i) => i !== index) });
  };

  const movePackage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= config.packages.length) return;
    const packages = [...config.packages];
    [packages[index], packages[nextIndex]] = [packages[nextIndex], packages[index]];
    setConfig({ ...config, packages });
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = Object.fromEntries((Object.keys(keys) as Kind[]).map((kind) => [keys[kind], JSON.stringify(configs[kind])]));
      const response = await fetch("/api/site-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setMessage("Pricing pages saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Owner</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Pricing Pages</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Control the separate Car Packages, Exterior, and Interior pages. Package names, exact prices, features, badges, order, and buttons are all editable here.</p></div>
          <div className="flex flex-wrap gap-2"><a href="/owner/booking-settings" className="rounded-full border border-white/15 px-4 py-2.5 text-sm">Add-Ons & Discounts</a><a href="/owner/gallery" className="rounded-full border border-white/15 px-4 py-2.5 text-sm">Photos & Media</a><a href="/owner/dashboard" className="rounded-full border border-white/15 px-4 py-2.5 text-sm">Back</a></div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 rounded-[22px] border border-white/10 bg-white/[.025] p-2">
          {(Object.keys(labels) as Kind[]).map((kind) => <button key={kind} onClick={() => setActive(kind)} className={`rounded-[16px] px-5 py-3 text-sm font-semibold transition ${active === kind ? "bg-[#FF2D2D] text-[#0D0D0D]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>{labels[kind]}</button>)}
        </div>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">{labels[active]} page</h2><p className="mt-1 text-sm text-white/40">Public page: {routes[active]}</p></div><a href={routes[active]} target="_blank" className="rounded-full border border-white/15 px-4 py-2 text-sm">Preview page ↗</a></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/55">Small heading<input className={input} value={config.eyebrow} onChange={(e) => setConfig({ ...config, eyebrow: e.target.value })} /></label>
            <label className="text-sm text-white/55 md:col-span-2">Main headline<textarea className={`${input} min-h-24`} value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} /></label>
            <label className="text-sm text-white/55 md:col-span-2">Page description<textarea className={`${input} min-h-24`} value={config.body} onChange={(e) => setConfig({ ...config, body: e.target.value })} /></label>
            <label className="text-sm text-white/55 md:col-span-2">Pricing note<textarea className={`${input} min-h-24`} value={config.priceNote} onChange={(e) => setConfig({ ...config, priceNote: e.target.value })} /></label>
          </div>
        </section>

        <div className="mt-7 space-y-6">
          {config.packages.map((pkg, index) => (
            <article key={pkg.id} className="rounded-[28px] border border-white/10 bg-[#111318] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#FF2D2D]">Package {index + 1}</p><h3 className="mt-2 text-2xl font-semibold">{pkg.name}</h3><p className="mt-1 text-xs text-white/30">Photo placement: {labels[active]} → {pkg.name} → Package Photos</p></div>
                <div className="flex flex-wrap gap-2"><button onClick={() => movePackage(index, -1)} className="rounded-full border border-white/10 px-3 py-2 text-xs">↑ Move</button><button onClick={() => movePackage(index, 1)} className="rounded-full border border-white/10 px-3 py-2 text-xs">↓ Move</button><button onClick={() => removePackage(index)} className="rounded-full border border-red-500/25 px-3 py-2 text-xs text-red-300">Delete</button></div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-white/55">Package ID<input className={input} value={pkg.id} onChange={(e) => updatePackage(index, { id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /><span className="mt-1 block text-[11px] text-white/25">Used for booking and photo placement. Keep it short.</span></label>
                <label className="text-sm text-white/55">Tier / small label<input className={input} value={pkg.tier} onChange={(e) => updatePackage(index, { tier: e.target.value })} /></label>
                <label className="text-sm text-white/55">Package name<input className={input} value={pkg.name} onChange={(e) => updatePackage(index, { name: e.target.value })} /></label>
                <label className="text-sm text-white/55">Badge<input className={input} value={pkg.badge || ""} onChange={(e) => updatePackage(index, { badge: e.target.value })} placeholder="Most Popular" /></label>
                <label className="text-sm text-white/55 md:col-span-2">Description<textarea className={`${input} min-h-20`} value={pkg.description} onChange={(e) => updatePackage(index, { description: e.target.value })} /></label>
                <label className="text-sm text-white/55">Coupe fixed price<input type="number" min="0" step="1" className={input} value={pkg.prices.coupe} onChange={(e) => updatePrice(index, "coupe", e.target.value)} /></label>
                <label className="text-sm text-white/55">Sedan fixed price<input type="number" min="0" step="1" className={input} value={pkg.prices.sedan} onChange={(e) => updatePrice(index, "sedan", e.target.value)} /></label>
                <label className="text-sm text-white/55">Truck & SUV fixed price<input type="number" min="0" step="1" className={input} value={pkg.prices.truckSuv} onChange={(e) => updatePrice(index, "truckSuv", e.target.value)} /></label>
                <label className="text-sm text-white/55">Button text<input className={input} value={pkg.ctaLabel} onChange={(e) => updatePackage(index, { ctaLabel: e.target.value })} /></label>
                <label className="text-sm text-white/55 md:col-span-2">What is included — one item per line<textarea className={`${input} min-h-44 font-mono`} value={pkg.features.join("\n")} onChange={(e) => updateFeatures(index, e.target.value)} /></label>
                <label className="flex items-center gap-3 text-sm text-white/65"><input type="checkbox" checked={Boolean(pkg.featured)} onChange={(e) => updatePackage(index, { featured: e.target.checked })} /> Highlight this package card</label>
              </div>
            </article>
          ))}
        </div>

        <button onClick={addPackage} className="mt-6 rounded-full border border-[#FF2D2D]/30 bg-[#FF2D2D]/8 px-5 py-3 text-sm font-semibold text-[#FF2D2D]">+ Add another package</button>

        <div className="sticky bottom-4 z-20 mt-10 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#FF2D2D]/20 bg-[#0D0D0D]/95 p-4 shadow-2xl backdrop-blur-xl">
          <button onClick={save} disabled={saving} className="rounded-full bg-[#FF2D2D] px-7 py-3 font-semibold text-[#0D0D0D] disabled:opacity-50">{saving ? "Saving…" : "Save All Pricing Pages"}</button>
          {message && <p className="text-sm text-white/55">{message}</p>}
        </div>
      </div>
    </main>
  );
}
