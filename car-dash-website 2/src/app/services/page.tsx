"use client";

import { useEffect, useState } from "react";
import BookingForm from "../../components/BookingForm";
import Modal from "../../components/Modal";

type Service = { id: string; title: string; description: string; price: number; image: string | null };
const fallback: Service[] = [
  { id:"basic", title:"Basic Detail", price:159, image:null, description:"A solid inside-and-out reset: vacuum, wipe down, windows, seats, crevices, wheels, tire dressing, exterior gloss, and a foam wash." },
  { id:"premium", title:"Premium Detail", price:219, image:null, description:"My go-to full detail. Everything in Basic plus disinfecting, vents, spray protection, two foam washes, and a proper contact wash." },
  { id:"ultimate", title:"Ultimate Detail", price:399, image:null, description:"For a car that needs more than a clean. Everything in Premium plus a light buff, one-step paint enhancement, and hand wax." },
];
const addOns = ["Pet Hair Removal — $39","Seat Shampoo — $49","Carpet Extraction — $59","Heavy Stain Removal — $69","Leather Protection — $39","Odor Treatment — $49","Engine Bay — $49","Iron Decon — $45","Clay Bar — $59","Hand Wax — $49","Ceramic Sealant — $79","Wheel Coating — $89","Trim Restoration — $45","Bug & Tar — $35"];

export default function ServicesPage(){
  const [services,setServices]=useState<Service[]>(fallback); const [selected,setSelected]=useState<Service|null>(null);
  useEffect(()=>{fetch('/api/services',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(d=>{if(Array.isArray(d)&&d.length)setServices(d)}).catch(()=>{})},[]);
  return <div className="brand-grid min-h-screen bg-[#070707] text-white">
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.3em] text-[#ef233c]">Services & pricing</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Pick what your car actually needs.</h1><p className="mt-5 text-base leading-8 text-neutral-400">These are my starting prices. Bigger vehicles, heavy stains, pet hair, or paint that needs extra work can change the final price. If you're not sure, send me the car and I'll point you in the right direction.</p></div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">{services.map((s,i)=><article key={s.id} className={`relative rounded-[1.75rem] border p-7 ${i===1?'border-[#ef233c]/60 bg-[#151010] red-glow':'border-white/10 bg-[#101010]'}`}>{i===1&&<span className="absolute right-5 top-5 rounded-full bg-[#ef233c] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Most popular</span>}<p className="text-xs font-bold uppercase tracking-[.24em] text-[#ef233c]">{s.title}</p><div className="mt-5 flex items-end gap-2"><span className="text-4xl font-black">${s.price}</span><span className="pb-1 text-sm text-neutral-500">starting</span></div><p className="mt-5 min-h-28 whitespace-pre-line text-sm leading-7 text-neutral-400">{s.description}</p><button onClick={()=>setSelected(s)} className="mt-7 w-full rounded-full bg-[#ef233c] px-5 py-3 text-sm font-bold transition hover:bg-[#c9182b]">Book {s.title}</button></article>)}</div>
      <section className="mt-16 rounded-[1.75rem] border border-white/10 bg-[#101010] p-7 sm:p-9"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.3em] text-[#ef233c]">Add-ons</p><h2 className="mt-3 text-2xl font-bold">Need a little more?</h2><p className="mt-3 text-sm leading-7 text-neutral-400">Add these when the car needs extra attention. I'll confirm everything with you before the job.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{addOns.map(x=><div key={x} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-neutral-300">{x}</div>)}</div></section>
      <section className="mt-10 rounded-[1.75rem] border border-[#ef233c]/25 bg-[#130c0d] p-7 sm:p-9"><h2 className="text-2xl font-bold">Paint correction & ceramic coating</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-400">For correction and coatings, I price the car after I know what the paint looks like and what result you're after. One-step enhancement starts at $149 with Premium or higher. Multi-step correction and ceramic coatings are quoted based on the vehicle and condition.</p><button onClick={()=>setSelected({id:'custom',title:'Paint Correction / Ceramic Coating',description:'',price:0,image:null})} className="mt-6 rounded-full border border-[#ef233c]/50 px-6 py-3 text-sm font-bold text-white hover:bg-[#ef233c]">Ask for a quote</button></section>
    </main>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?.title||"Book a detail"}>{selected&&<BookingForm prefill={{service:selected.title}} onClose={()=>setSelected(null)}/>}</Modal>
  </div>
}
