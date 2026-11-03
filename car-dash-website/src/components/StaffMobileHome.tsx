"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";
import { useOwnerScreenPrivacy } from "@/lib/owner-screen-privacy";

type Tool={permission:string;href:string;title:string;description:string;kind:string;badge?:number};
type Booking={id:string;customerName:string;serviceName:string;preferredDate:string|null;preferredTime?:string|null;status:string;quotedPrice:number|null};
function todayChicago(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const part=(type:string)=>parts.find(x=>x.type===type)?.value||"";
 return [part("year"),part("month"),part("day")].join("-");
}
function niceDate(date:string){
 const [year,month,day]=date.split("-").map(Number);
 return new Date(year,month-1,day,12).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
}
function niceTime(raw?:string|null){
 const m=String(raw||"").match(/^(\d{1,2}):(\d{2})/);
 if(!m)return "Time TBD";
 const hour=Number(m[1]);return (hour%12||12)+":"+m[2]+" "+(hour>=12?"PM":"AM");
}
const getIcon=(kind:string):OwnerIconName=>({
 booking:"calendar",message:"message",quote:"quote",support:"support",
 phone:"phone",photo:"globe",analytics:"chart",guide:"book",
}[kind]||"activity") as OwnerIconName;
export default function StaffMobileHome({name,permissions,tools,smsUnread}:{
 name?:string|null;permissions:string[];tools:Tool[];smsUnread:number;
}){
 const [today,setToday]=useState(todayChicago);
 const [bookings,setBookings]=useState<Booking[]>([]);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const {recording,changeRecording}=useOwnerScreenPrivacy("staff");
 const canBook=permissions.includes("bookings");
 useEffect(()=>{
   if(!canBook){setBusy(false);return;}
   let disposed=false;
   const load=async()=>{
     try{
       const r=await fetch("/api/bookings",{cache:"no-store"});
       if(!r.ok)throw new Error("Bookings unavailable");
       const b=await r.json();
       if(!disposed){setBookings(Array.isArray(b)?b:[]);setError("");setToday(todayChicago());}
     }catch{if(!disposed)setError("Booking totals could not be loaded.");}
     finally{if(!disposed)setBusy(false);}
   };
   void load();
   const interval=window.setInterval(()=>{if(!document.hidden)void load();},60000);
   return()=>{disposed=true;window.clearInterval(interval);};
 },[canBook]);
 const todays=useMemo(()=>bookings.filter(b=>b.preferredDate===today&&!["cancelled","canceled"].includes((b.status||"").toLowerCase())).sort((a,b)=>(a.preferredTime||"").localeCompare(b.preferredTime||"")),[bookings,today]);
 const pending=bookings.filter(b=>["pending","requested"].includes((b.status||"").toLowerCase()));
 const top=tools.slice(0,5);
 const stats=[
   ...(canBook?[
     {name:"Appointments today",value:busy?"—":String(todays.length),detail:"Scheduled bookings",icon:"calendar" as OwnerIconName,href:"/admin/bookings"},
     {name:"Awaiting confirmation",value:busy?"—":String(pending.length),detail:"Pending booking requests",icon:"quote" as OwnerIconName,href:"/admin/bookings"},
   ]:[]),
   ...(permissions.includes("smsInbox")?[{name:"Unread texts",value:String(smsUnread),detail:"Customer messages",icon:"message" as OwnerIconName,href:"/admin/messages"}]:[]),
   {name:"Your staff tools",value:String(tools.length),detail:"Access set by the owner",icon:"activity" as OwnerIconName,href:"#staff-tools"},
 ];
 return <div className="staff-mobile-home min-h-[80dvh] bg-[#121211] px-4 pb-8 pt-5 text-[#f3ebdd] md:hidden">
   <div className="mx-auto max-w-lg space-y-5">
     <section>
       <p className="text-xs text-[#b8afa2]">{niceDate(today)}</p>
       <h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em]">Welcome{recording?" back":name?.trim()?", "+name.split(" ")[0]:""}.</h1>
       <p className="mt-2 text-sm text-[#aaa093]">Your Car Dash staff workspace.</p>
       <a href="/admin/profile" className="mt-4 inline-flex rounded-lg border border-[#d6b779]/35 bg-[#d6b779]/10 px-3 py-2.5 text-xs font-semibold text-[#e7cfa0]">Edit profile photo, contact & saved cars</a>
       <div className="mt-5 flex flex-wrap gap-2">
         {canBook&&<Link href="/admin/bookings" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#d6b779] px-4 text-xs font-bold text-[#181714]"><OwnerAppIcon name="calendar" className="h-4 w-4"/> Open bookings</Link>}
         {permissions.includes("assignedJobs")&&<Link href="/owner/jobs" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d6b779]/40 bg-[#2a271f] px-4 text-xs font-semibold text-[#e7d0a1]"><OwnerAppIcon name="check" className="h-4 w-4"/> My jobs</Link>}
         {!canBook&&!permissions.includes("assignedJobs")&&<a href="#staff-tools" className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#d6b779]/40 px-4 text-xs font-semibold text-[#e7d0a1]">Open my tools</a>}
       </div>
     </section>
     <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1d1c1a] px-4 py-3">
       <div><p className="text-xs font-semibold text-[#f2e5d5]">Recording privacy</p>
         <p className="mt-1 text-[10px] leading-4 text-[#b1a698]">{recording?"Private customer details are hidden.":"Turn on before recording your screen."}</p></div>
       <button type="button" role="switch" aria-label="Staff recording privacy mode" aria-checked={recording} onClick={()=>changeRecording(!recording)}
         className={"relative h-7 w-12 shrink-0 rounded-full border "+(recording?"border-[#d6b779] bg-[#d6b779]":"border-white/25 bg-[#4d4740]")}>
         <span className={"absolute top-[3px] h-[18px] w-[18px] rounded-full bg-[#171612] transition-all "+(recording?"left-[25px]":"left-[3px]")}/>
       </button>
     </div>
     {error&&<p role="alert" className="rounded-xl border border-amber-300/25 bg-amber-900/15 p-3 text-xs text-[#f0d6b4]">{error}</p>}
     <section className="grid grid-cols-2 gap-3" aria-label="Staff summary">
       {stats.map(item=><Link key={item.name} href={recording?"#":item.href} onClick={e=>{if(recording)e.preventDefault();}}
         className="min-h-[132px] rounded-[20px] border border-white/10 bg-[#1d1d1c] p-3.5">
         <div className="flex items-center gap-2 text-[#cbbfae]"><OwnerAppIcon name={item.icon} className="h-[17px] w-[17px] text-[#d6b779]"/><p className="text-[11px] leading-4">{item.name}</p></div>
         <p className="mt-4 text-[27px] font-semibold tabular-nums tracking-[-.045em]">{item.value}</p>
         <p className="mt-2 text-[10px] leading-4 text-[#aaa093]">{item.detail}</p>
       </Link>)}
     </section>
     {canBook&&<section className="rounded-[22px] border border-white/10 bg-[#1b1a19] p-4">
       <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Schedule</p><h2 className="mt-1 text-lg font-semibold">Today's appointments</h2></div><Link href="/admin/bookings" className="text-xs font-semibold text-[#dfc798]">View all</Link></div>
       <div className="mt-3 space-y-2">
         {busy?<p className="px-2 py-6 text-center text-xs text-[#ada396]">Loading authorized bookings…</p>:
         todays.length?todays.slice(0,5).map((booking,i)=><Link key={booking.id} href={recording?"#":"/admin/bookings"} onClick={e=>{if(recording)e.preventDefault();}}
           className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#252321] p-3.5">
           <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d6b779]/40 bg-[#d6b779]/10 text-xs font-semibold text-[#e7cc9c]">{i+1}</span>
           <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#f3e9db]">{niceTime(booking.preferredTime)} · {recording?"Customer details hidden":booking.customerName||"Customer"}</span>
             <span className="mt-1 block truncate text-[11px] text-[#b7ac9d]">{recording?"Detailing appointment":booking.serviceName||"Detailing service"}</span>
           </span>
           <span className="shrink-0 rounded-full border border-[#d6b779]/25 bg-[#31291d] px-2 py-1 text-[10px] capitalize text-[#e5cfaa]">{booking.status||"Pending"}</span>
         </Link>):
         <p className="rounded-xl border border-white/10 bg-[#252321] px-4 py-6 text-center text-xs text-[#ada396]">No scheduled appointments today.</p>}
       </div>
     </section>}
     <section id="staff-tools" className="scroll-mt-28 rounded-[22px] border border-white/10 bg-[#1b1a19] p-4">
       <div><p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Your permissions</p>
         <h2 className="mt-1 text-lg font-semibold">Staff tools</h2>
         <p className="mt-1 text-[11px] leading-5 text-[#a99f93]">Only tools your owner has enabled appear here.</p>
       </div>
       {top.length?<div className="mt-4 divide-y divide-white/10">{top.map(tool=><Link key={tool.href} href={recording?"#":tool.href} onClick={e=>{if(recording)e.preventDefault();}}
         className="flex items-center gap-3 py-3.5">
         <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d6b779]/20 bg-[#d6b779]/10 text-[#d6b779]"><OwnerAppIcon name={getIcon(tool.kind)} className="h-5 w-5"/></span>
         <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{tool.title}</span>
           <span className="mt-1 block truncate text-[11px] text-[#aaa092]">{tool.description}</span></span>
         <OwnerAppIcon name="chevron-right" className="h-4 w-4 shrink-0 text-[#d6b779]"/>
       </Link>)}</div>:<p className="mt-5 text-sm text-[#aca292]">No staff tools have been assigned yet. Ask the owner to grant access.</p>}
     </section>
   </div>
 </div>;
}
