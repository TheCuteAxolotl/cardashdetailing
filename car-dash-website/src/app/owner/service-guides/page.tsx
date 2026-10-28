"use client";
import {useEffect,useMemo,useState} from "react";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { DEFAULT_BOOKING_PRICING, parseBookingPricingConfig } from "@/lib/booking-pricing";
import { findTrainingGuide } from "@/lib/service-training-guide";

type GuideOption = {key:string;name:string;group:string};
const defaults: GuideOption[] = [
  ...(["packages","interior","exterior"] as const).flatMap(type=>DEFAULT_PRICING_PAGES[type].packages.map(item=>({key:`package:${type}:${item.id}`,name:item.name,group:type==="packages"?"Detail Packages":type==="interior"?"Interior":"Exterior"}))),
  {key:"headlight",name:"Headlight Restoration",group:"Specialty"},
  {key:"ceramic",name:"Ceramic Coating",group:"Specialty"},
  {key:"correction",name:"Paint Correction",group:"Specialty"},
  {key:"marine",name:"Marine Detailing",group:"Specialty"},
  ...DEFAULT_BOOKING_PRICING.addOns.map(item=>({key:item.id,name:item.name,group:"Add-ons"})),
];
export default function ServiceGuidesPage(){
  const [options,setOptions]=useState<GuideOption[]>(defaults);
  const [selected,setSelected]=useState(defaults[0]?.key||"");
  const [done,setDone]=useState<number[]>([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const requestedName=params.get("item")||"";
    const requestedId=params.get("id")||"";
    (async()=>{
      try{
        const [a,b]=await Promise.all([fetch("/api/site-content",{cache:"no-store"}),fetch("/api/services",{cache:"no-store"})]);
        const content=a.ok?await a.json():{};
        const additions:GuideOption[]=(["packages","interior","exterior"] as const).flatMap(type=>
          parsePricingConfig(content?.[type==="packages"?"pricingPackagesConfig":type==="interior"?"pricingInteriorConfig":"pricingExteriorConfig"],DEFAULT_PRICING_PAGES[type]).packages.map(item=>
            ({key:`package:${type}:${item.id}`,name:item.name,group:type==="packages"?"Detail Packages":type==="interior"?"Interior":"Exterior"})));
        const addons=parseBookingPricingConfig(content?.bookingPricingConfig).addOns.map(item=>({key:item.id,name:item.name,group:"Add-ons"}));
        const services=b.ok?await b.json():[];
        const specials:GuideOption[]=Array.isArray(services)?services.map((item:{id:string;title:string})=>({key:`service:${item.id}`,name:item.title,group:"Other services"})):[];
        const next=[...additions,...addons,...specials,
          {key:"headlight",name:"Headlight Restoration",group:"Specialty"},
          {key:"ceramic",name:"Ceramic Coating",group:"Specialty"},
          {key:"correction",name:"Paint Correction",group:"Specialty"},
          {key:"marine",name:"Marine Detailing",group:"Specialty"}];
        const unique=next.filter((item,i,list)=>list.findIndex(a=>a.key===item.key)===i);
        setOptions(unique);
        const match=unique.find(item=>item.key===requestedId)||unique.find(item=>item.name.toLowerCase()===requestedName.toLowerCase());
        if(match)setSelected(match.key);
      }catch{
        const match=defaults.find(item=>item.key===requestedId)||defaults.find(item=>item.name.toLowerCase()===requestedName.toLowerCase());
        if(match)setSelected(match.key);
      }
    })();
  },[]);
  const active=options.find(item=>item.key===selected)||options[0];
  const guide=findTrainingGuide(active?.name||"Custom Detail",active?.key||"");
  const filtered=useMemo(()=>options.filter(item=>(filter==="All"||item.group===filter)&&(`${item.name} ${item.group}`).toLowerCase().includes(search.trim().toLowerCase())),[options,filter,search]);
  const groups=["All",...Array.from(new Set(options.map(item=>item.group)))];
  const toggleStep=(index:number)=>setDone(old=>old.includes(index)?old.filter(n=>n!==index):[...old,index]);
  const stepsText=()=>[guide.title,guide.focus,"TOOLS / MATERIALS",...guide.equipment.map(s=>"- "+s),"STEP BY STEP",...guide.steps.map((s,i)=>`${i+1}. ${s}`),"QUALITY CONTROL",...guide.checks.map((s,i)=>`${i+1}. ${s}`),"Car Dash Detailing training reference. Follow current manufacturer product instructions and customer-specific scope."].join("\n");
  return <main className="owner-training-page min-h-screen bg-[#101010] px-4 py-8 text-[#f4efe5] sm:px-7">
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-6">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e5c995]">Car Dash · Owner training manual</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Complete Service Guides</h1><p className="mt-2 text-sm text-[#cec9c1]">Teach each service with preparation, safe workflow, inspection and a clickable checklist.</p></div>
        <div className="flex flex-wrap gap-2"><a href="/owner/estimate-calculator" className="rounded-lg border border-white/20 bg-[#1c1c1c] px-4 py-3 text-sm font-medium">Estimate calculator</a><a href="/owner/dashboard" className="rounded-lg border border-white/20 bg-[#1c1c1c] px-4 py-3 text-sm font-medium">Dashboard</a></div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[315px_1fr]">
        <aside className="rounded-xl border border-white/15 bg-[#1c1c1c] p-4 lg:self-start">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#cec9c1]">Find any service</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Smoke, ceramic, carpet…" className="mt-2 w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm outline-none"/>
          <div className="mt-3 flex flex-wrap gap-1">{groups.map(group=><button type="button" key={group} onClick={()=>setFilter(group)} className={`rounded-full border px-2.5 py-1.5 text-[11px] ${filter===group?"border-black bg-black text-white":"border-white/20 bg-[#1c1c1c] text-[#d9d5cc]"}`}>{group}</button>)}</div>
          <div className="mt-4 max-h-[65vh] space-y-1 overflow-auto">{filtered.map(item=><button key={item.key} onClick={()=>{setSelected(item.key);setDone([]);}} className={`block w-full rounded-lg px-3 py-2.5 text-left ${item.key===active.key?"bg-[#343021] text-[#f4efe5]":"hover:bg-white/10"}`}><span className="block text-sm font-medium">{item.name}</span><span className="mt-0.5 block text-xs text-[#b9b5ad]">{item.group}</span></button>)}{!filtered.length&&<p className="p-3 text-sm text-[#b9b5ad]">No matching service.</p>}</div>
        </aside>
        <article className="rounded-xl border border-white/15 bg-[#1c1c1c] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-[#e5c995]">{active.group}</p><h2 className="mt-1 text-2xl font-semibold">{guide.title}</h2><p className="mt-2 text-sm text-[#cec9c1]">{guide.focus}</p></div>
            <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(stepsText());}catch{}}} className="rounded-lg border border-white/20 bg-[#262626] px-4 py-2.5 text-sm font-semibold">Copy guide</button>
          </div>
          <section className="mt-6 rounded-xl bg-[#242424] p-5"><h3 className="text-xl font-semibold">Preparation & equipment</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-[#d9d5cc]">{guide.equipment.map((item,i)=><li key={i}>{item}</li>)}</ul></section>
          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold">Step-by-step procedure</h3><span className="text-xs text-[#b9b5ad]">{done.length} of {guide.steps.length} steps completed</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d6b779]" style={{width:`${guide.steps.length?done.length/guide.steps.length*100:0}%`}}/></div>
            <ol className="mt-4 space-y-3">{guide.steps.map((step,i)=><li key={i}><label className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 sm:p-5 ${done.includes(i)?"border-[#d6b779] bg-[#343021]":"border-white/15"}`}><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={done.includes(i)} onChange={()=>toggleStep(i)}/><div><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#e5c995]">Step {i+1}</span><p className="text-base leading-7 text-[#f4efe5]">{step}</p></div></label></li>)}</ol>
          </section>
          <section className="mt-7 rounded-xl border border-white/15 bg-[#242424] p-5"><h3 className="text-xl font-semibold">Final quality-control checklist</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#d9d5cc]">{guide.checks.map((step,i)=><li key={i}>{step}</li>)}</ul></section>
          <p className="mt-5 text-xs leading-5 text-[#b9b5ad]">Training guide — adapt to manufacturer instructions, vehicle materials, climate, service agreement, and local safety/environmental rules. Chemicals must never be mixed unless explicitly directed by their manufacturer.</p>
        </article>
      </div>
    </div>
  </main>;
}
