"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import OwnerAppIcon, {type OwnerIconName} from "@/components/OwnerAppIcon";

type Tile={title:string;caption:string;href:string;icon:OwnerIconName;status?:string};
const sections:{heading:string;subtitle:string;tiles:Tile[]}[]=[
 {heading:"Sales & customers",subtitle:"Follow the lead all the way to the booking",tiles:[
   {title:"New leads",caption:"New, contacted and quoted prospects",href:"/owner/leads",icon:"quote",status:"leads"},
   {title:"Customer CRM",caption:"Contact records, garages, notes and follow-ups",href:"/owner/crm",icon:"users"},
   {title:"Quotes",caption:"Discuss estimates and convert accepted work",href:"/owner/quotes",icon:"message"},
   {title:"Bookings",caption:"Confirm, edit and reserve mobile jobs",href:"/owner/bookings",icon:"calendar"},
 ]},
 {heading:"Jobs & quality",subtitle:"Keep service consistent from arrival to handoff",tiles:[
   {title:"Final inspection",caption:"Quality checklist, after photos and owner approval",href:"/owner/inspection",icon:"check",status:"inspections"},
   {title:"Jobs & team assignments",caption:"Assign detailers and track work in progress",href:"/owner/jobs",icon:"activity"},
   {title:"Today's schedule",caption:"Calendar, service addresses and routes",href:"/owner/schedule",icon:"calendar"},
   {title:"Customer messages",caption:"One inbox for customer SMS and replies",href:"/owner/messages",icon:"message"},
 ]},
 {heading:"Business & financials",subtitle:"Real operations data, without invented totals",tiles:[
   {title:"Revenue by service",caption:"Monthly paid invoice revenue and mix",href:"/owner/revenue",icon:"chart",status:"revenue"},
   {title:"Pay tracking",caption:"Manual hours, overtime and commission worksheet",href:"/owner/pay-tracking",icon:"receipt"},
   {title:"Invoices & payments",caption:"Record payments, balances and receipts",href:"/owner/invoices",icon:"receipt"},
   {title:"Employees",caption:"Manage accounts, roles and permissions",href:"/owner/admins",icon:"users"},
 ]},
 {heading:"Pricing & supplies",subtitle:"Set service prices and keep equipment ready",tiles:[
   {title:"Price builder",caption:"Select services, add-ons, vehicle size and total",href:"/owner/detail-builder",icon:"calculator"},
   {title:"Supply inventory",caption:"Low stock, on-order items and arrival dates",href:"/owner/inventory",icon:"book",status:"inventory"},
   {title:"Service price lists",caption:"Edit packages and public service prices",href:"/owner/pricing-pages",icon:"receipt"},
   {title:"Photo library",caption:"Your actual work, before and after",href:"/owner/gallery",icon:"activity"},
 ]},
];
type CountData={leads:number|null;inspections:number|null;inventory:number|null;revenue:string|null};
function money(n:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);}
export default function OwnerWorkspace(){
 const [stats,setStats]=useState<CountData>({leads:null,inspections:null,inventory:null,revenue:null});
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 async function load(){
   setLoading(true);setError("");
   const urls=["/api/crm","/api/jobs","/api/owner/inventory","/api/owner/revenue"];
   const results=await Promise.allSettled(urls.map(async url=>{
     const response=await fetch(url,{cache:"no-store"});
     if(!response.ok)throw Error("Unavailable");
     return response.json();
   }));
   const values=results.map(r=>r.status==="fulfilled"?r.value:null);
   const crm=values[0], jobs=values[1], inventory=values[2], revenue=values[3];
   const isLead=(c:{profile?:Record<string,string>;bookings?:{status:string}[]})=>{
     const explicit=(c.profile?.stage||"").toLowerCase();
     if(["customer","inactive"].includes(explicit))return false;
     if(c.bookings?.some(b=>["completed","confirmed"].includes(b.status)))return false;
     return true;
   };
   setStats({
     leads:Array.isArray(crm?.customers)?crm.customers.filter(isLead).length:null,
     inspections:Array.isArray(jobs?.jobs)?jobs.jobs.filter((j:{state:string})=>j.state==="awaiting_review").length:null,
     inventory:Array.isArray(inventory?.items)?inventory.items.filter((x:{quantity:number;reorderAt:number})=>x.quantity<=x.reorderAt).length:null,
     revenue:typeof revenue?.current?.total==="number"?money(revenue.current.total):null,
   });
   if(values.every(v=>!v))setError("Live dashboard totals are unavailable; the tools below still open.");
   setLoading(false);
 }
 useEffect(()=>{void load();},[]);
 const metric=(key:string)=>{
   const value=stats[key as keyof CountData];
   if(value===null)return loading?"Loading":"Open tool";
   if(key==="leads")return value+" active leads";
   if(key==="inspections")return value+" awaiting review";
   if(key==="inventory")return value+" at reorder level";
   return value+" received this month";
 };
 return <main className="min-h-screen bg-[#131211] px-4 py-6 text-[#f2e9dc] sm:px-7 sm:py-10">
   <div className="mx-auto max-w-6xl space-y-7">
     <header className="flex flex-wrap items-end justify-between gap-3">
       <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d6b779]">Car Dash · Operations CRM</p>
         <h1 className="mt-2 text-3xl font-semibold tracking-tight">Business workspace</h1>
         <p className="mt-2 text-sm leading-6 text-[#aaa092]">From the first message to the final inspection. Everything in one place.</p>
       </div>
       <div className="flex gap-2">
         <Link href="/owner/bookings?create=1" className="rounded-xl bg-[#d6b779] px-4 py-3 text-xs font-bold text-[#171715]">New booking</Link>
         <button type="button" onClick={()=>void load()} className="rounded-xl border border-white/20 px-3 py-3 text-xs font-semibold text-[#e6d7c5]">Refresh</button>
       </div>
     </header>
     {error&&<p role="alert" className="rounded-xl border border-white/15 bg-[#302820] p-3 text-xs text-[#f1d1a8]">{error}</p>}
     <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="CRM overview">
       {([["Open leads","leads"],["Final reviews","inspections"],["Supply alerts","inventory"],["Received","revenue"]] as const).map(([name,key])=>
         <div key={key} className="rounded-2xl border border-[#d6b779]/20 bg-[#221f1a] p-4">
           <p className="text-[11px] text-[#bcb0a1]">{name}</p>
           <p className="mt-3 text-base font-semibold text-[#e6c993] sm:text-lg">{metric(key)}</p>
         </div>)}
     </section>
     {sections.map(section=><section key={section.heading}>
       <div className="mb-3"><h2 className="text-lg font-semibold text-[#f4eadb]">{section.heading}</h2>
         <p className="mt-1 text-xs text-[#a89e90]">{section.subtitle}</p>
       </div>
       <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
         {section.tiles.map(tile=><Link key={tile.href} href={tile.href} className="group rounded-2xl border border-white/10 bg-[#211f1d] p-4 transition hover:border-[#d6b779]/45 hover:bg-[#2c2821]">
           <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6b779]/25 bg-[#d6b779]/10 text-[#e5cc98]"><OwnerAppIcon name={tile.icon} className="h-5 w-5"/></span>
           <h3 className="mt-3 text-sm font-semibold leading-5 text-[#f0e5d5]">{tile.title}</h3>
           <p className="mt-2 text-[11px] leading-5 text-[#afa396]">{tile.caption}</p>
           {tile.status&&<p className="mt-3 text-[10px] font-semibold text-[#d6b779]">{metric(tile.status)}</p>}
         </Link>)}
       </div>
     </section>)}
     <p className="border-t border-white/10 pt-5 text-[11px] leading-5 text-[#918879]">This workspace links the original Car Dash systems. Customer records, approved job inspections, saved pricing and actual invoice payments stay in their existing databases.</p>
   </div>
 </main>;
}
