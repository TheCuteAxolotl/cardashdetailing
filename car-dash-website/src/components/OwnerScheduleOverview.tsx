"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerAppIcon from "@/components/OwnerAppIcon";
import type { EditableBooking } from "@/components/BookingDetailsEditor";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";

export type ScheduleView = "month" | "week" | "day" | "agenda";
type StatusFilter = "all" | "pending" | "confirmed" | "completed";
type Event = { id: string; date: string; time: string; title: string; detail: string; booking?: EditableBooking; task?: OwnerScheduleTask; tone: string };
const C = {
  gold: "border-[#a98d50]/45 bg-[#51452a] text-[#f6dfac]",
  green: "border-[#6d987b]/45 bg-[#264637] text-[#d2efdc]",
  blue: "border-[#788f9a]/40 bg-[#2b414b] text-[#d7eaf3]",
  plum: "border-[#8f809d]/45 bg-[#393149] text-[#e9daf8]",
  neutral: "border-white/10 bg-[#292827] text-[#c3bcb0]",
};
const dateText = (value: Date) => [value.getFullYear(), String(value.getMonth()+1).padStart(2,"0"), String(value.getDate()).padStart(2,"0")].join("-");
const fromISO = (value: string) => { const [y,m,d] = value.split("-").map(Number); return new Date(y,m-1,d,12); };
const plusDays = (d: Date, num: number) => { const copy=new Date(d); copy.setDate(copy.getDate()+num); return copy; };
const dayName = (d:Date) => d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const monthTitle = (d:Date) => d.toLocaleDateString("en-US",{month:"long",year:"numeric"});
const timeText = (value?:string|null) => {
 const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
 if(!match) return "Time TBD";
 const h=Number(match[1]); return (h%12||12)+":"+match[2]+" "+(h>=12?"PM":"AM");
};
const money = (n:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const weekStart = (d:Date) => plusDays(d,-d.getDay());
const bookingTone = (status?: string) => {
 const s=(status||"").toLowerCase();
 if(["confirmed","accepted","approved"].includes(s)) return C.green;
 if(s==="completed") return C.blue;
 if(["pending","requested"].includes(s)) return C.gold;
 if(s==="cancelled") return C.neutral;
 return C.plum;
};
export default function OwnerScheduleOverview({
 bookings, tasks, loading, onEditBooking, initialDate,
}:{
 bookings:EditableBooking[];
 tasks:OwnerScheduleTask[];
 loading:boolean;
 onEditBooking:(booking:EditableBooking)=>void;
 initialDate?:string;
}){
 const [anchor,setAnchor]=useState(()=>fromISO(initialDate || dateText(new Date())));
 const [selected,setSelected]=useState(()=>initialDate || dateText(new Date()));
 const [view,setView]=useState<ScheduleView>("month");
 // A full seven-column grid is useful on desktop; use the readable agenda on phones.
 useEffect(()=>{
   if(window.matchMedia("(max-width: 639px)").matches)setView("agenda");
 },[]);
 const [status,setStatus]=useState<StatusFilter>("all");
 const today=initialDate||dateText(new Date());
 const activeBookings=useMemo(()=>bookings.filter(b=>{
  const s=(b.status||"").toLowerCase();
  return Boolean(b.preferredDate) && (status==="all" || (status==="confirmed"
   ? ["confirmed","accepted","approved"].includes(s) : s===status));
 }),[bookings,status]);
 const events=useMemo<Event[]>(()=>{
  const rows:Event[] = [
   ...activeBookings.map(b=>({
    id:"booking:"+b.id,date:b.preferredDate!,time:b.preferredTime||"99:99",
    title:b.customerName||"Customer", detail:b.serviceName||"Detailing",
    booking:b,tone:bookingTone(b.status),
   })),
   ...tasks.filter(t=>t.date).map(t=>({
    id:"task:"+t.id,date:t.date,time:t.time||"99:99",title:t.title,
    detail:t.type==="plan"?"Owner plan":"Owner task",task:t,
    tone:t.completed?C.neutral:C.plum,
   })),
  ];
  return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.title.localeCompare(b.title));
 },[activeBookings,tasks]);
 const indexed=useMemo(()=>{
  const groups=new Map<string,Event[]>();
  for(const e of events)groups.set(e.date,[...(groups.get(e.date)||[]),e]);
  return groups;
 },[events]);
 const selectDate=(value:string)=>{setSelected(value);setAnchor(fromISO(value));};
 const step=(direction:number)=>{
  const next=new Date(anchor);
  if(view==="month")next.setMonth(anchor.getMonth()+direction);
  else next.setDate(anchor.getDate()+direction*(view==="week"?7:1));
  setAnchor(next);
  setSelected(dateText(next));
 };
 const monthStart = weekStart(new Date(anchor.getFullYear(),anchor.getMonth(),1,12));
 const monthDays = Array.from({length:42},(_,i)=>plusDays(monthStart,i));
 const firstWeek = weekStart(anchor);
 const weekDays = Array.from({length:7},(_,i)=>plusDays(firstWeek,i));
 const selectedEvents=indexed.get(selected)||[];
 const periodStart = view==="month"?dateText(new Date(anchor.getFullYear(),anchor.getMonth(),1,12))
  : view==="week"?dateText(firstWeek):selected;
 const periodEnd = view==="month"?dateText(new Date(anchor.getFullYear(),anchor.getMonth()+1,0,12))
  : view==="week"?dateText(weekDays[6]):selected;
 const periodBookings = activeBookings.filter(b=>b.preferredDate!>=periodStart&&b.preferredDate!<=periodEnd);
 const periodValue = periodBookings.reduce((sum,b)=>sum+(Number(b.quotedPrice)||0),0);
 const open = (event:Event)=>{ if(event.booking)onEditBooking(event.booking); else if(event.task)window.location.assign("/owner/schedule"); };
 const title = view==="month"?monthTitle(anchor):view==="week"
  ? dayName(weekDays[0])+" – "+dayName(weekDays[6]):dayName(anchor);
 const views:ScheduleView[]=["month","week","day","agenda"];

 const eventBadge=(event:Event,compact:boolean)=>(
  <button type="button" key={event.id} onClick={(e)=>{e.stopPropagation();open(event);}}
   title={timeText(event.time)+" · "+event.title+" · "+event.detail}
   className={"block w-full min-w-0 truncate rounded-md border px-1.5 py-1 text-left text-[10px] font-medium leading-4 transition hover:brightness-125 sm:px-2 "+event.tone}>
   <span className="font-semibold">{event.time==="99:99"?"":timeText(event.time)+" "}</span>
   <span>{event.title}</span>{!compact&&<span className="hidden opacity-80 2xl:inline"> · {event.detail}</span>}
  </button>
 );
 return <section className="owner-calendar-overview overflow-hidden rounded-2xl border border-white/[.12] bg-[#1c1c1b]">
   <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
     <div>
       <p className="text-[10px] font-bold uppercase tracking-[.20em] text-[#d6b779]">Work calendar</p>
       <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#f5eee2] sm:text-2xl">{title}</h2>
       <p className="mt-1 text-xs text-[#aba397]">{loading?"Loading appointments…":periodBookings.length+" scheduled appointments"} · {money(periodValue)} in booked value</p>
     </div>
     <div className="flex flex-wrap items-center gap-2">
       <button onClick={()=>{const now=new Date();setAnchor(now);setSelected(dateText(now));}}
        className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-[#e6ddd1] hover:bg-white/10">Today</button>
       <button onClick={()=>step(-1)} aria-label="Previous period" className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-[#dfd3c4] hover:bg-white/10"><OwnerAppIcon name="chevron-left" className="h-4 w-4"/></button>
       <button onClick={()=>step(1)} aria-label="Next period" className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-[#dfd3c4] hover:bg-white/10"><OwnerAppIcon name="chevron-right" className="h-4 w-4"/></button>
       <label className="sr-only" htmlFor="owner-calendar-status">Filter bookings by status</label>
       <select id="owner-calendar-status" value={status} onChange={e=>setStatus(e.target.value as StatusFilter)}
        className="rounded-lg border border-white/20 bg-[#272623] px-3 py-2 text-xs text-[#eee5d8] outline-none focus:border-[#d6b779]">
         <option value="all">All statuses</option><option value="pending">Pending</option>
         <option value="confirmed">Confirmed</option><option value="completed">Completed</option>
       </select>
       <a href="/owner/schedule" className="rounded-lg bg-[#d6b779] px-3 py-2 text-xs font-bold text-[#191714] hover:bg-[#ead49f]">Full schedule</a>
     </div>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
     <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#121212] p-1" aria-label="Calendar view">
       {views.map(v=><button key={v} type="button" aria-pressed={view===v}
        onClick={()=>setView(v)} className={"rounded-lg px-3 py-2 text-xs font-semibold capitalize transition "+(view===v?"bg-[#d6b779] text-[#191714]":"text-[#bdb4a8] hover:bg-white/10 hover:text-white")}>{v}</button>)}
     </div>
     <div className="flex flex-wrap gap-3 text-[10px] text-[#c3b9ad]">
       <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#b59a5c]"/>Pending</span>
       <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#77a68b]"/>Confirmed</span>
       <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#88a9bd]"/>Completed</span>
       <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9d89b9]"/>Tasks</span>
     </div>
   </div>

   {view==="month"&&<div className="overflow-x-auto">
     <div className="min-w-[630px]">
       <div className="grid grid-cols-7 border-b border-white/10 bg-[#22211f]">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#ada397]">{d}</div>)}</div>
       <div className="grid grid-cols-7">
         {monthDays.map(d=>{
           const id=dateText(d),onMonth=d.getMonth()===anchor.getMonth(),current=id===today;
           const rows=indexed.get(id)||[];
           const selectedDay=id===selected;
           return <div key={id}
             className={"min-h-[99px] min-w-0 border-b border-r border-white/[.09] px-1.5 py-1.5 text-left align-top transition sm:min-h-[124px] sm:px-2 sm:py-2 "+(selectedDay?"bg-[#d6b779]/10 ring-1 ring-inset ring-[#d6b779]/35":"hover:bg-white/[.035]")+" "+(!onMonth?"opacity-40":"")}>
             <button type="button" onClick={()=>selectDate(id)} aria-pressed={selectedDay} aria-label={dayName(d)+", "+rows.length+" items"} className={"mb-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold "+(current?"bg-[#d6b779] text-[#181715]":selectedDay?"text-[#f1d59e]":"text-[#c5bdb2]")}>{d.getDate()}</button>
             <span className="block space-y-1">{rows.slice(0,3).map(e=>eventBadge(e,true))}</span>
             {rows.length>3&&<button type="button" onClick={()=>{selectDate(id);setView("day");}} className="mt-1 block text-[10px] font-semibold text-[#d6b779]">+{rows.length-3} more</button>}
           </div>;
         })}
       </div>
     </div>
   </div>}

   {view==="week"&&<div className="overflow-x-auto">
     <div className="grid min-w-[630px] grid-cols-7">
       {weekDays.map(d=>{const id=dateText(d),rows=indexed.get(id)||[];return <div key={id} className={"min-h-[320px] border-r border-white/10 p-2 "+(id===today?"bg-[#d6b779]/[.045]":"")}>
        <button onClick={()=>{selectDate(id);setView("day");}} className={"mb-3 block w-full rounded-lg px-2 py-2 text-left text-xs font-semibold "+(id===today?"bg-[#d6b779] text-[#191714]":"bg-[#282723] text-[#d8cfc0] hover:bg-[#39362e]")}>{d.toLocaleDateString("en-US",{weekday:"short"})}<span className="block text-xl">{d.getDate()}</span></button>
        <div className="space-y-1.5">{rows.map(e=>eventBadge(e,false))}</div>
       </div>})}
     </div>
   </div>}

   {(view==="day"||view==="agenda")&&<div className="min-h-[220px] divide-y divide-white/10">
     {(view==="day" ? selectedEvents : events.filter(e=>e.date>=today).slice(0,75)).length===0
       ? <div className="p-10 text-center text-sm text-[#aba397]">No scheduled items for this view.</div>
       : (view==="day" ? selectedEvents : events.filter(e=>e.date>=today).slice(0,75)).map(e=><button key={e.id} onClick={()=>open(e)}
           className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-white/[.045]">
           <span className="w-[98px] shrink-0 text-xs text-[#d9bd86]">{view==="agenda"?e.date:timeText(e.time)}</span>
           <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#f2ebdf]">{e.title}</span><span className="mt-1 block text-xs text-[#b2a99e]">{e.detail} · {timeText(e.time)}</span></span>
           <span className={"h-3 w-3 shrink-0 rounded-full border "+e.tone}/>
         </button>)
     }
   </div>}

   {(view==="month"||view==="week")&&<div className="border-t border-white/10 bg-[#211f1d] px-4 py-4 sm:px-6">
     <div className="flex flex-wrap items-center justify-between gap-3">
       <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d6b779]">Selected day</p><p className="mt-1 text-sm font-semibold text-[#efe6d9]">{dayName(fromISO(selected))} · {selectedEvents.length} items</p></div>
       <a href="/owner/bookings?create=1" className="rounded-lg border border-[#d6b779]/35 px-3 py-2 text-xs font-semibold text-[#e5ce9f] hover:bg-[#d6b779]/10">Add booking</a>
     </div>
     <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
       {selectedEvents.length ? selectedEvents.slice(0,6).map(e=><button key={e.id} onClick={()=>open(e)}
         className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#2a2926] p-3 text-left hover:border-[#d6b779]/40">
         <span className={"h-9 w-1 shrink-0 rounded "+e.tone}/><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#eee8df]">{e.title}</span><span className="mt-1 block truncate text-[11px] text-[#b4a99c]">{e.detail} · {timeText(e.time)}</span></span>
       </button>) : <p className="text-xs text-[#999186]">No jobs or planner tasks on this day.</p>}
     </div>
   </div>}
  </section>;
}
