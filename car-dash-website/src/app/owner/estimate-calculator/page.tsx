"use client";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS, type VehicleClass, parsePricingConfig } from "@/lib/pricing-config";
import { DEFAULT_BOOKING_PRICING, parseBookingPricingConfig, STANDALONE_HEADLIGHT_SERVICE_ID, type BookingPricingConfig } from "@/lib/booking-pricing";
import { recommendedServiceMinutes, recommendedAddOnMinutes } from "@/lib/booking-duration";

type ServiceOption = { id: string; title: string; description?: string; category?: string; price: number; startingPrice?: number | null; pricingType: string; active: boolean };
type EstimateChoice = { key: string; durationKey: string; name: string; price: number; duration: number; quoteRequired?: boolean; group: string };
const money = (value: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const time = (mins: number) => `${Math.floor(mins/60)}h ${mins%60 ? `${mins%60}m` : ""}`.trim();
const classes: VehicleClass[] = ["coupe", "sedan", "truckSuv"];
const odorIds = ["odor-treatment", "odor-smoke", "odor-severe"];

export default function EstimateCalculatorPage() {
  const [vehicle, setVehicle] = useState<VehicleClass>("coupe");
  const [pricing, setPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [pages, setPages] = useState(DEFAULT_PRICING_PAGES);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [customPrice, setCustomPrice] = useState(0);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [contentResponse, servicesResponse] = await Promise.all([
          fetch("/api/site-content",{cache:"no-store"}),
          fetch("/api/services",{cache:"no-store"}),
        ]);
        if (!contentResponse.ok) throw new Error("Could not load live pricing");
        const content = await contentResponse.json();
        setPricing(parseBookingPricingConfig(content?.bookingPricingConfig));
        setPages({
          packages: parsePricingConfig(content?.pricingPackagesConfig,DEFAULT_PRICING_PAGES.packages),
          exterior: parsePricingConfig(content?.pricingExteriorConfig,DEFAULT_PRICING_PAGES.exterior),
          interior: parsePricingConfig(content?.pricingInteriorConfig,DEFAULT_PRICING_PAGES.interior),
        });
        if (servicesResponse.ok) {
          const rows = await servicesResponse.json();
          if (Array.isArray(rows)) setServices(rows);
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not fetch pricing; showing default estimates.");
      } finally { setLoading(false); }
    })();
  }, []);
  const choices = useMemo(() => {
    const items: EstimateChoice[] = [];
    for (const [group, label] of [["packages","Full Detail Packages"],["interior","Interior Only"],["exterior","Exterior Only"]] as const) {
      for (const pkg of pages[group].packages) {
        const durationKey = `package:${group}:${pkg.id}:${vehicle}`;
        items.push({
          key: `package:${group}:${pkg.id}`, durationKey, name: pkg.name,
          price: Number(pkg.prices[vehicle] || 0),
          duration: pricing.serviceDurations[durationKey] ?? recommendedServiceMinutes(durationKey, pkg.name),
          group: label,
        });
      }
    }
    const headlightKey = `service:${STANDALONE_HEADLIGHT_SERVICE_ID}`;
    items.push({key:headlightKey,durationKey:headlightKey,name:"Headlight Restoration",price:pricing.headlightStandalonePrice,
      duration:pricing.serviceDurations[headlightKey] ?? pricing.headlightStandaloneDuration,group:"Standalone"});
    for (const service of services.filter((item) => item.active && item.title.trim().toLowerCase() !== "headlight restoration")) {
      const key = `service:${service.id}`;
      const fixed = service.pricingType === "fixed" && Number(service.price) > 0;
      items.push({key,durationKey:key,name:service.title,price:fixed ? Number(service.price) : Number(service.startingPrice || 0),
        quoteRequired:!fixed,duration:pricing.serviceDurations[key] ?? recommendedServiceMinutes(key, service.title),
        group:service.category || "Other Services"});
    }
    return items;
  }, [vehicle,pages,pricing,services]);
  const addons = useMemo(() => pricing.addOns.filter(item=>item.active),[pricing]);
  const pickedServices = choices.filter(item=>selectedServices.includes(item.key));
  const pickedAddOns = addons.filter(item=>selectedAddOns.includes(item.id));
  const serviceCost = pickedServices.reduce((sum,item)=>sum+item.price,0);
  const addonCost = pickedAddOns.reduce((sum,item)=>sum+Number(item.price),0);
  const serviceMinutes = pickedServices.reduce((sum,item)=>sum+item.duration,0);
  const addonMinutes = pickedAddOns.reduce((sum,item)=>sum+(item.durationMinutes ?? recommendedAddOnMinutes(item.name,item.id)),0);
  const subtotal = Math.max(0, serviceCost + addonCost + Number(customPrice || 0));
  const totalMinutes = Math.max(0, serviceMinutes + addonMinutes + Number(extraMinutes || 0));
  const quoteRequired = pickedServices.some(x=>x.quoteRequired) || pickedAddOns.some(x=>x.quoteRequired);
  const toggle = (value:string,current:string[],set:(items:string[])=>void)=>set(current.includes(value)?current.filter(x=>x!==value):[...current,value]);
  const toggleAddon = (id:string) => {
    if (selectedAddOns.includes(id)) return setSelectedAddOns(items=>items.filter(x=>x!==id));
    setSelectedAddOns(items=>odorIds.includes(id)?[...items.filter(x=>!odorIds.includes(x)),id]:[...items,id]);
  };
  const estimateText = () => [
    "CAR DASH DETAILING | PRIVATE ESTIMATE",
    `Vehicle size: ${VEHICLE_LABELS[vehicle]}`,
    "SERVICES",...pickedServices.map(x=>`- ${x.name}: ${money(x.price)} | ${time(x.duration)}`),
    "ADD-ONS",...pickedAddOns.map(x=>`- ${x.name}: ${money(x.price)} | ${time(x.durationMinutes??recommendedAddOnMinutes(x.name,x.id))}`),
    customPrice ? `Manual adjustment: ${money(customPrice)}` : "",
    extraMinutes ? `Additional time: ${time(extraMinutes)}` : "",
    `TOTAL ESTIMATED PRICE: ${money(subtotal)}`,
    `TOTAL ESTIMATED TIME: ${time(totalMinutes)}`,
    quoteRequired ? "CUSTOM QUOTE REQUIRED — prices are starting estimates" : "Subject to vehicle inspection and final scope.",
    notes ? `Notes: ${notes}` : "",
  ].filter(Boolean).join("\n");
  const copy = async () => { try {await navigator.clipboard.writeText(estimateText());setStatus("Estimate copied.");} catch {setStatus("Couldn't copy. Try selecting text manually.");} };
  const field = "w-full rounded-lg border border-white/20 bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#f4efe5] outline-none focus:border-[#d6b779]";
  return <main className="owner-estimate-page min-h-screen bg-[#101010] px-4 py-8 text-[#f4efe5] sm:px-7">
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-6">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e5c995]">Car Dash / Owner only</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Service & Time Calculator</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#cec9c1]">Build an estimate with your current website prices, every add-on, editable appointment durations, and instant training instructions.</p></div>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-lg border border-white/20 bg-[#1c1c1c] px-4 py-3 text-sm font-medium" href="/owner/service-guides">Complete training guides</a>
          <a className="rounded-lg border border-white/20 bg-[#1c1c1c] px-4 py-3 text-sm font-medium" href="/owner/booking-settings">Edit times & add-ons</a>
          <a className="rounded-lg border border-white/20 bg-[#1c1c1c] px-4 py-3 text-sm font-medium" href="/owner/dashboard">Dashboard</a>
        </div>
      </div>
      {status && <p role="status" className="mt-5 rounded-lg border border-white/15 bg-[#1c1c1c] p-3 text-sm text-[#d9d5cc]">{status}</p>}
      {loading && <p className="mt-4 text-sm text-[#cec9c1]">Loading current service prices and times…</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_365px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-5">
            <h2 className="text-lg font-semibold">1. Vehicle size</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">{classes.map(value=><button type="button" key={value} onClick={()=>setVehicle(value)} className={`rounded-lg border p-3 text-sm font-medium ${vehicle===value?"border-[#d6b779] bg-[#d6b779] text-[#101010]":"border-white/15 bg-[#1c1c1c] text-[#d9d5cc]"}`}>{VEHICLE_LABELS[value]}</button>)}</div>
          </section>
          <section className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">2. Select services</h2><span className="text-xs text-[#b9b5ad]">{pickedServices.length} chosen</span></div>
            {Array.from(new Set(choices.map(c=>c.group))).map(group=><div key={group} className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#b9b5ad]">{group}</h3>
              <div className="grid gap-2 sm:grid-cols-2">{choices.filter(c=>c.group===group).map(item=><div key={item.key} className={`flex flex-col gap-2 rounded-xl border p-3 ${selectedServices.includes(item.key)?"border-[#d6b779] bg-[#343021]":"border-white/15"}`}>
                <label className="flex cursor-pointer items-start gap-3"><input className="mt-1" type="checkbox" checked={selectedServices.includes(item.key)} onChange={()=>toggle(item.key,selectedServices,setSelectedServices)}/>
                  <span className="flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-xs text-[#cec9c1]">{money(item.price)}{item.quoteRequired?"+ / quoted":""} · {time(item.duration)}</span></span></label>
                <a className="w-fit text-xs font-semibold text-[#e5c995] underline" href={`/owner/service-guides?item=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.key)}`}>View complete service guide</a>
              </div>)}</div>
            </div>)}
          </section>
          <section className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">3. Select add-ons</h2><span className="text-xs text-[#b9b5ad]">{pickedAddOns.length} chosen</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{addons.map(item=><div key={item.id} className={`flex flex-col gap-2 rounded-xl border p-3 ${selectedAddOns.includes(item.id)?"border-[#d6b779] bg-[#343021]":"border-white/15"}`}>
              <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1" checked={selectedAddOns.includes(item.id)} onChange={()=>toggleAddon(item.id)}/>
                <span className="flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="mt-1 block text-xs text-[#cec9c1]">{money(item.price)}{item.quoteRequired?"+ / quote first":""} · {time(item.durationMinutes??recommendedAddOnMinutes(item.name,item.id))}</span></span></label>
              <a className="w-fit text-xs font-semibold text-[#e5c995] underline" href={`/owner/service-guides?item=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.id)}`}>View step-by-step guide</a>
            </div>)}</div>
          </section>
          <section className="rounded-2xl border border-white/15 bg-[#1c1c1c] p-5">
            <h2 className="text-lg font-semibold">4. Custom adjustments</h2>
            <p className="mt-1 text-xs text-[#cec9c1]">Use these for a one-time estimate. Default times and prices stay unchanged.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[#d9d5cc]">Price adjustment ($)<input type="number" step="1" className={`${field} mt-1`} value={customPrice} onChange={e=>setCustomPrice(Number(e.target.value)||0)}/></label>
              <label className="text-sm text-[#d9d5cc]">Extra time (minutes)<input type="number" min="0" step="15" className={`${field} mt-1`} value={extraMinutes} onChange={e=>setExtraMinutes(Math.max(0,Number(e.target.value)||0))}/></label>
            </div>
            <label className="mt-4 block text-sm text-[#d9d5cc]">Condition / quote notes<textarea rows={3} className={`${field} mt-1`} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Heavy pet hair, smoke, ceramic preparation, paint condition, travel…"/></label>
          </section>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/15 bg-[#141414] p-5 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e5c995]">Live estimate</p>
            <h2 className="mt-2 text-2xl font-semibold">Price & appointment length</h2>
            <div className="mt-5 space-y-3 border-t border-white/15 pt-4 text-sm">
              {pickedServices.map(item=><div key={item.key} className="flex justify-between gap-4"><span className="text-white/65">{item.name} <small className="block text-white/35">{time(item.duration)}</small></span><span>{money(item.price)}</span></div>)}
              {pickedAddOns.map(item=><div key={item.id} className="flex justify-between gap-4"><span className="text-white/65">{item.name} <small className="block text-white/35">{time(item.durationMinutes??recommendedAddOnMinutes(item.name,item.id))}</small></span><span>{money(item.price)}</span></div>)}
              {customPrice!==0 && <div className="flex justify-between"><span>Adjustment</span><span>{money(customPrice)}</span></div>}
              {!pickedServices.length&&!pickedAddOns.length&&<p className="text-white/45">Select work to calculate an estimate.</p>}
            </div>
            <div className="mt-5 border-t border-white/20 pt-5">
              <p className="text-xs text-white/50">Estimated total</p><p className="mt-1 text-4xl font-semibold">{money(subtotal)}{quoteRequired&&<span className="text-lg">+</span>}</p>
              <p className="mt-4 text-xs text-white/50">Estimated working time</p><p className="mt-1 text-3xl font-semibold">{time(totalMinutes)}</p>
            </div>
            {quoteRequired&&<p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">One or more selections require a custom quote. This price is only a starting estimate.</p>}
            <p className="mt-4 text-xs leading-5 text-white/40">Estimate only. Vehicle condition, drying/cure time, travel, severe contamination and service compatibility can change the final quote. Do not add overlapping package work twice.</p>
            <button onClick={copy} disabled={pickedServices.length===0&&pickedAddOns.length===0} className="mt-5 w-full rounded-lg bg-[#d6b779] px-4 py-3 font-semibold text-black disabled:opacity-40">Copy customer estimate</button>
            <button onClick={()=>{setSelectedServices([]);setSelectedAddOns([]);setCustomPrice(0);setExtraMinutes(0);setNotes("");setStatus("");}} className="mt-2 w-full rounded-lg border border-white/15 px-4 py-3 text-sm text-white/75">Clear estimate</button>
          </div>
        </aside>
      </div>
    </div>
  </main>;
}
