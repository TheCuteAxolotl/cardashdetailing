"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OwnerAppIcon from "@/components/OwnerAppIcon";
import { useOwnerScreenPrivacy } from "@/lib/owner-screen-privacy";

type Quote = {id:string;subject?:string;status:string;guestVehicle?:string;quotedPrice?:number|null;createdAt?:string};
type Booking = {id:string;serviceName?:string;vehicleYear?:string;vehicleMake?:string;vehicleModel?:string;status:string;createdAt?:string};
type Lead = {id:string;name:string;email:string;phone:string;address:string;bookings:Booking[];quotes:Quote[];profile:Record<string,string>};
type Stage = "New"|"Contacted"|"Quoted";
const tabNames:Stage[]=["New","Contacted","Quoted"];
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
function leadStage(c:Lead):"New"|"Contacted"|"Quoted"|"Customer"|"Inactive"{
 const stage=(c.profile.stage||"").toLowerCase();
 if(stage==="inactive")return "Inactive";
 if(stage==="customer"||c.bookings.some(b=>["confirmed","completed"].includes(b.status)))return "Customer";
 if(stage==="quoted"||c.quotes.some(q=>["quoted","accepted"].includes(q.status)))return "Quoted";
 if(stage==="contacted")return "Contacted";
 return "New";
}
function leadDate(c:Lead){
 const values=[...c.quotes.map(q=>q.createdAt||""),...c.bookings.map(b=>b.createdAt||"")].filter(Boolean).sort().reverse();
 const date=values[0];if(!date)return "Added to Car Dash";
 const at=new Date(date);
 if(Number.isNaN(at.getTime()))return "Added to Car Dash";
 return at.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"America/Chicago"});
}
function bookingPrefill(c:Lead){
 const recent=c.bookings[0];
 const quote=c.quotes[0];
 const fields=new URLSearchParams({create:"1",customerName:c.profile.name||c.name});
 const values:Record<string,string>={
   customerEmail:c.profile.email||c.email,
   customerPhone:c.profile.phone||c.phone,
   serviceName:recent?.serviceName||quote?.subject||"",
   vehicleYear:recent?.vehicleYear||"",
   vehicleMake:recent?.vehicleMake||"",
   vehicleModel:recent?.vehicleModel||"",
   serviceAddress:c.profile.address||c.address||"",
 };
 for(const [key,value]of Object.entries(values))if(value)fields.set(key,value.slice(0,240));
 return "/owner/bookings?"+fields;
}
function detail(c:Lead){
 const booking=c.bookings[0];
 const q=c.quotes[0];
 const car=[booking?.vehicleYear,booking?.vehicleMake,booking?.vehicleModel].filter(Boolean).join(" ");
 return {vehicle:c.profile.vehicleNotes||car||q?.guestVehicle||"Vehicle not recorded",
  service:booking?.serviceName||q?.subject||"Service not chosen",
  quoted:q?.quotedPrice==null?null:money(q.quotedPrice),
 };
}
export default function OwnerLeadsPage(){
 const [leads,setLeads]=useState<Lead[]>([]);
 const [tab,setTab]=useState<Stage>("New");
 const [busy,setBusy]=useState("");
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [notice,setNotice]=useState("");
 const {recording}=useOwnerScreenPrivacy();
 const load=useCallback(async()=>{
   setError("");
   try{
     const r=await fetch("/api/crm",{cache:"no-store"});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(data.error||"Could not load leads.");
     setLeads(Array.isArray(data.customers)?data.customers:[]);
   }catch(e){setError(e instanceof Error?e.message:"Could not load leads.");}
   finally{setLoaded(true);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const filtered=useMemo(()=>leads.filter(c=>leadStage(c)===tab&&
   (c.profile.name||c.name+" "+c.profile.phone||c.phone+" "+c.profile.source||"").toLowerCase().includes(search.toLowerCase())),
   [leads,tab,search]);
 const counts=Object.fromEntries(tabNames.map(x=>[x,leads.filter(c=>leadStage(c)===x).length])) as Record<Stage,number>;
 async function move(c:Lead,next:"Contacted"|"Quoted"|"Inactive"){
   setBusy(c.id);setError("");setNotice("");
   try{
     const payload={...c.profile,id:c.id,name:c.profile.name||c.name,email:c.profile.email||c.email,
      phone:c.profile.phone||c.phone,address:c.profile.address||c.address,stage:next};
     const r=await fetch("/api/crm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(data.error||"Lead status could not be saved.");
     setLeads(old=>old.map(row=>row.id===c.id?{...row,profile:{...row.profile,stage:next}}:row));
     setNotice("Lead moved to "+next+".");
   }catch(e){setError(e instanceof Error?e.message:"Could not update lead.");}
   finally{setBusy("");}
 }
 const badge=(x:Stage)=>x==="New"?"border-[#78aa8a]/35 bg-[#2b4332] text-[#b8e0c2]":x==="Contacted"?
   "border-[#88a7ca]/35 bg-[#263b4f] text-[#c1d9f0]":"border-[#d6b779]/35 bg-[#403322] text-[#efdcaa]";
 return <main className="min-h-screen bg-[#131211] px-4 py-6 text-[#f1e9dd] sm:px-7 sm:py-10">
  <div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Sales pipeline</p>
       <h1 className="mt-2 text-3xl font-semibold tracking-tight">New leads</h1>
       <p className="mt-1 text-xs leading-6 text-[#afa597]">Follow up with prospects and turn quotes into scheduled jobs.</p>
      </div>
      <Link href="/owner/crm" className="rounded-xl border border-[#d6b779]/35 px-4 py-2.5 text-xs font-semibold text-[#e8d2a1]">All customers</Link>
    </header>
    <nav aria-label="Lead status" className="grid grid-cols-3 gap-2">
      {tabNames.map(item=><button key={item} type="button" onClick={()=>setTab(item)} aria-pressed={tab===item}
       className={"min-w-0 rounded-xl border px-2 py-3 text-[11px] font-semibold sm:text-sm "+(tab===item?"border-[#d6b779] bg-[#d6b779] text-[#161514]":"border-white/15 bg-[#262521] text-[#d7cbb9]")}>
       {item} · {loaded?counts[item]:"—"}
      </button>)}
    </nav>
    <div className="flex flex-wrap gap-2">
      <label className="min-w-[190px] flex-1 text-xs font-medium text-[#bfb3a4]">
        Search leads
        <input value={search} onChange={e=>setSearch(e.target.value)} type="search" placeholder="Customer, number or source"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#272622] px-3.5 py-3 text-base text-[#f1e9dd] outline-none placeholder:text-[#918779] focus:border-[#d6b779]"/>
      </label>
      <button type="button" onClick={()=>void load()} className="self-end rounded-xl border border-white/20 bg-[#282620] px-4 py-3 text-xs font-semibold">Refresh</button>
    </div>
    {error&&<p role="alert" className="rounded-xl border border-red-300/30 bg-red-900/20 p-3 text-sm text-red-100">{error}</p>}
    {notice&&<p role="status" className="rounded-xl border border-[#d6b779]/30 bg-[#30291e] p-3 text-sm text-[#edd6aa]">{notice}</p>}
    <div className="space-y-3">
      {!loaded?<p className="rounded-xl border border-white/10 bg-[#22201e] px-5 py-10 text-center text-sm text-[#b2a899]">Loading your leads…</p>
       :!filtered.length?<div className="rounded-2xl border border-white/10 bg-[#201f1d] px-5 py-10 text-center">
        <p className="text-base font-semibold">No {tab.toLowerCase()} leads</p>
        <p className="mt-2 text-xs leading-5 text-[#a99e91]">New quote requests, bookings and manually added leads appear here when they match this stage.</p>
        <Link className="mt-4 inline-flex rounded-xl bg-[#d6b779] px-4 py-2.5 text-xs font-bold text-[#151412]" href="/owner/crm">Add a lead in CRM</Link>
       </div>
       :filtered.map(c=>{
         const info=detail(c), stage=leadStage(c);
         const customerName=recording?"Customer details hidden":c.profile.name||c.name;
         const phone=recording?"":c.profile.phone||c.phone;
         return <article key={c.id} className="rounded-[20px] border border-white/10 bg-[#211f1d] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
           <h2 className="min-w-0 flex-1 text-lg font-semibold tracking-tight">{customerName}</h2>
           <span className={"rounded-full border px-2.5 py-1 text-[11px] font-semibold "+badge(stage as Stage)}>{stage}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#d9bf89]">{recording?"Vehicle hidden":info.vehicle}</p>
          <p className="mt-1 text-sm text-[#ddd4c8]">{recording?"Service request":info.service}{!recording&&info.quoted?" · Quote "+info.quoted:""}</p>
          <p className="mt-2 text-xs text-[#aba092]">{leadDate(c)}</p>
          {c.profile.source&&<span className="mt-2 inline-block rounded-full bg-[#39362f] px-3 py-1 text-[11px] text-[#d6c5aa]">{recording?"Source hidden":c.profile.source}</span>}
          {!recording&&c.profile.followUp&&<p className="mt-2 text-xs text-[#e1bd8e]">Follow up: {c.profile.followUp}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
           {phone?<a href={"tel:"+phone.replace(/[^+\d]/g,"")} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#2b2926] px-2 text-xs font-semibold text-[#f1e8db]"><OwnerAppIcon name="phone" className="h-4 w-4"/> Call</a>
            :<span className="grid min-h-11 place-items-center rounded-xl border border-white/10 px-2 text-xs text-[#9c9285]">Contact unavailable</span>}
           <Link href={recording?"/owner/crm":bookingPrefill(c)}
             className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#d6b779] px-2 text-xs font-bold text-[#1a1713]">
             <OwnerAppIcon name="calendar" className="h-4 w-4"/>{recording?"View CRM":"Make it a job"}
           </Link>
           {phone&&!recording&&<Link href={"/owner/messages?phone="+encodeURIComponent(phone)+"&name="+encodeURIComponent(c.profile.name||c.name)}
             className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 px-2 text-xs font-semibold text-[#e4d7c3]">Open conversation</Link>}
           <button type="button" disabled={Boolean(busy)||recording}
             onClick={()=>void move(c,tab==="New"?"Contacted":tab==="Contacted"?"Quoted":"Contacted")}
             className="min-h-10 rounded-xl border border-[#d6b779]/40 px-2 text-xs font-semibold text-[#e6ca96] disabled:opacity-40">
             {busy===c.id?"Saving…":tab==="New"?"Mark contacted":tab==="Contacted"?"Mark quoted":"Move to contacted"}
           </button>
          </div>
         </article>;
       })}
    </div>
    <p className="text-[11px] leading-5 text-[#9f9587]">Lead stages use saved CRM records and quote status. “Make it a job” opens a prefilled manual booking form; a job is not confirmed or texted until you explicitly save it.</p>
  </div>
 </main>;
}
