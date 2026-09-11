"use client";

import { useEffect, useMemo, useState } from "react";

type Service = { id:string; title:string; price:number; startingPrice:number|null; maxPrice:number|null; pricingType:string; category:string; active:boolean };

export default function EstimatePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [vehicle, setVehicle] = useState("sedan");
  const [condition, setCondition] = useState("average");
  const [pet, setPet] = useState(false);
  const [stains, setStains] = useState(false);
  const [paint, setPaint] = useState("good");

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.json())
      .then((data) => {
        const active = Array.isArray(data) ? data.filter((item: Service) => item.active) : [];
        setServices(active);
        const query = new URLSearchParams(location.search).get("service");
        if (query && active.some((item: Service) => item.id === query)) setServiceId(query);
        else if (active[0]) setServiceId(active[0].id);
      });
  }, []);

  const result = useMemo(() => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return null;

    let low = service.pricingType === "fixed" ? service.price : (service.startingPrice ?? service.price ?? 150);
    let high = service.pricingType === "range" ? (service.maxPrice ?? low * 1.2) : service.pricingType === "quote" ? low * 1.25 : low * 1.15;
    const size = vehicle === "truck" ? 1.15 : vehicle === "suv" ? 1.1 : vehicle === "marine" ? 1.35 : 1;
    const conditionFactor = condition === "heavy" ? 1.2 : condition === "moderate" ? 1.1 : 1;
    low *= size * conditionFactor;
    high *= size * conditionFactor;
    if (pet) { low += 20; high += 40; }
    if (stains) { low += 25; high += 50; }
    if (paint === "rough") { low += 75; high += 175; }

    return {
      lo: Math.round(low / 5) * 5,
      hi: Math.round(high / 5) * 5,
      service,
    };
  }, [services, serviceId, vehicle, condition, pet, stains, paint]);

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-14 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Instant Estimate</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">Get a useful price range in under a minute.</h1>
        <p className="mt-4 max-w-2xl text-white/45">This is a planning estimate, not a final quote. For exact pricing, send photos and chat with a specialist.</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.12),rgba(255,255,255,.025))] p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm text-white/55">Service
                <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 focus:border-[#FF2D2D]/60 focus:outline-none">
                  {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/55">Vehicle
                <select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 focus:border-[#FF2D2D]/60 focus:outline-none">
                  <option value="sedan">Sedan / coupe</option><option value="suv">SUV / crossover</option><option value="truck">Truck / large SUV</option><option value="marine">Boat / marine</option>
                </select>
              </label>
              <label className="text-sm text-white/55">Overall condition
                <select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 focus:border-[#FF2D2D]/60 focus:outline-none">
                  <option value="average">Average / maintained</option><option value="moderate">Moderately dirty</option><option value="heavy">Heavy condition</option>
                </select>
              </label>
              <label className="text-sm text-white/55">Paint / surface condition
                <select value={paint} onChange={(event) => setPaint(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 focus:border-[#FF2D2D]/60 focus:outline-none">
                  <option value="good">Good</option><option value="rough">Needs correction / oxidation help</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-5">
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={pet} onChange={(event) => setPet(event.target.checked)} /> Pet hair</label>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={stains} onChange={(event) => setStains(event.target.checked)} /> Heavy stains</label>
            </div>
          </div>

          <aside className="rounded-[30px] border border-[#FF2D2D]/20 bg-[#FF2D2D]/[.05] p-6">
            {result ? <>
              <p className="text-xs uppercase tracking-[.25em] text-[#FF2D2D]">Estimated range</p>
              <p className="mt-3 text-4xl font-semibold">${result.lo}–${result.hi}</p>
              <p className="mt-2 text-sm text-white/40">for {result.service.title}</p>
              <p className="mt-6 text-sm leading-6 text-white/45">This range considers the selected service, vehicle or boat type, and the condition details you provided. Final pricing is confirmed before booking and may change after photos or an in-person inspection.</p>
              {vehicle === "marine" && <p className="mt-3 text-xs leading-5 text-white/32">Marine work can vary more because length, oxidation, waterline buildup, access, and hull condition all affect labor.</p>}
              <a href={`/quote?service=${result.service.id}`} className="mt-6 block rounded-full bg-[#FF2D2D] px-5 py-3 text-center font-semibold text-[#0D0D0D]">Chat to a Specialist</a>
              <a href={`/contact?service=${encodeURIComponent(result.service.title)}`} className="mt-3 block rounded-full border border-white/15 bg-white/[.025] px-5 py-3 text-center text-sm">Request this service</a>
            </> : <p>Choose a service.</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
