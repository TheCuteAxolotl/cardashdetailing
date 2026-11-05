"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";
import OwnerScheduleOverview from "@/components/OwnerScheduleOverview";
import MobileOwnerDashboard from "@/components/MobileOwnerDashboard";
import BookingDetailsEditor, { type EditableBooking } from "@/components/BookingDetailsEditor";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";

type Activity={id:string;kind:string;title:string;detail:string;href:string;time:string};
type DashboardData={bookings:EditableBooking[];tasks:OwnerScheduleTask[];activity:Activity[];unread:number};
const actions:{title:string;detail:string;href:string;icon:OwnerIconName}[]=[
 {title:"Jobs & inspections",detail:"Track progress and quality",href:"/owner/jobs",icon:"calendar"},
 {title:"Customers",detail:"Records and service history",href:"/owner/crm",icon:"users"},
 {title:"Quotes",detail:"Respond and convert leads",href:"/owner/quotes",icon:"quote"},
 {title:"Payments",detail:"Invoices and balances",href:"/owner/invoices",icon:"receipt"},
 {title:"Subscriptions",detail:"Maintenance plans",href:"/owner/maintenance",icon:"activity"},
 {title:"Inventory",detail:"Supplies and reorder levels",href:"/owner/inventory",icon:"calculator"},
 {title:"Employees",detail:"Staff and access",href:"/owner/admins",icon:"users"},
 {title:"Products & services",detail:"Manage service catalog",href:"/owner/services",icon:"book"},
 {title:"Promo codes",detail:"Marketing and coupons",href:"/owner/promo-codes",icon:"gift"},
 {title:"Gift cards",detail:"Sales and redemptions",href:"/owner/gift-cards",icon:"gift"},
 {title:"Loyalty cards",detail:"Repeat-customer rewards",href:"/owner/loyalty",icon:"check"},
 {title:"Analytics",detail:"Business performance",href:"/owner/analytics",icon:"chart"},
];
const cash=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
function chicagoToday(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const pick=(s:string)=>parts.find(p=>p.type===s)?.value||"";
 return [pick("year"),pick("month"),pick("day")].join("-");
}
function niceTime(value:string|null|undefined){
 const m=String(value||"").match(/^(\d{1,2}):(\d{2})/);
 if(!m)return "Time TBD";
 const h=Number(m[1]);return (h%12||12)+":"+m[2]+" "+(h>=12?"PM":"AM");
}
function dateLabel(value:string){
 const [y,m,d]=value.split("-").map(Number);
 return new Date(y,m-1,d,12).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function stamp(value:string){
 const time=new Date(value).getTime();
 if(!Number.isFinite(time))return "";
 const minutes=Math.floor((Date.now()-time)/60000);
 return minutes<1?"Just now":minutes<60?minutes+"m ago":minutes<1440?Math.floor(minutes/60)+"h ago":new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

export default function OwnerDashboard(){
 const [data,setData]=useState<DashboardData>({bookings:[],tasks:[],activity:[],unread:0});
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState("");
 const [editor,setEditor]=useState<EditableBooking|null>(null);
 const [lastUpdated,setLastUpdated]=useState<string|null>(null);
 const [today,setToday]=useState(chicagoToday);
 const load=useCallback(async()=>{
   const results=await Promise.allSettled([
     fetch("/api/bookings",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Bookings unavailable");return r.json();}),
     fetch("/api/owner-schedule",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Planner unavailable");return r.json();}),
     fetch("/api/owner/activity",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Activity unavailable");return r.json();}),
     fetch("/api/sms/inbox",{cache:"no-store"}).then(async r=>r.ok?r.json():null),
   ]);
   const bookings=results[0].status==="fulfilled" && Array.isArray(results[0].value) ? results[0].value as EditableBooking[] : null;
   const tasks=results[1].status==="fulfilled" && Array.isArray(results[1].value?.tasks) ? results[1].value.tasks as OwnerScheduleTask[] : [];
   const activity=results[2].status==="fulfilled" && Array.isArray(results[2].value?.alerts) ? results[2].value.alerts as Activity[] : [];
   const unread=results[3].status==="fulfilled" ? Number(results[3].value?.totalUnread||0) : 0;
   if(bookings) {
     setData({bookings,tasks,activity,unread:Number.isFinite(unread)?unread:0});
     setError("");
     setLastUpdated(new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}));
   } else setError("Bookings couldn't load. Check your connection and refresh.");
   setLoaded(true);setToday(chicagoToday());
 },[]);
 useEffect(()=>{
   void load();
   const interval=window.setInterval(()=>{if(!document.hidden)void load();},60000);
   const focus=()=>{void load();};
   window.addEventListener("focus",focus);
   return()=>{window.clearInterval(interval);window.removeEventListener("focus",focus);};
 },[load]);
 const upcoming=useMemo(()=>data.bookings.filter(b=>b.preferredDate && b.preferredDate>=today && !["cancelled","completed"].includes((b.status||"").toLowerCase()))
   .sort((a,b)=>(a.preferredDate||"").localeCompare(b.preferredDate||"")||(a.preferredTime||"").localeCompare(b.preferredTime||"")),[data.bookings,today]);
 const pending=data.bookings.filter(b=>["pending","requested"].includes((b.status||"").toLowerCase()));
 const todayJobs=upcoming.filter(b=>b.preferredDate===today);
 const scheduledValue=upcoming.reduce((sum,b)=>sum+Math.max(0,Number(b.quotedPrice)||0),0);
 const overdueTasks=data.tasks.filter(t=>!t.completed&&t.date<today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
 const soonTasks=data.tasks.filter(t=>!t.completed&&t.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
 const seen=new Set<string>();
 const activity=data.activity.filter(item=>{
   const key=item.kind==="message"?item.title.toLowerCase():item.id;
   if(seen.has(key))return false;
   seen.add(key);return true;
 }).slice(0,5);
 const nextJobs=upcoming.slice(0,5);
 const metrics=[
   {label:"Jobs today",value:todayJobs.length,meta:"Scheduled for your day",icon:"calendar" as OwnerIconName},
   {label:"Needs confirmation",value:pending.length,meta:"Review pending bookings",icon:"quote" as OwnerIconName},
   {label:"Unread texts",value:data.unread,meta:"Customer conversations",icon:"message" as OwnerIconName},
   {label:"Upcoming booked value",value:cash(scheduledValue),meta:"Estimated, not collected",icon:"chart" as OwnerIconName},
 ];
 return <>
   <MobileOwnerDashboard
     bookings={data.bookings}
     activity={activity}
     unread={data.unread}
     today={today}
     loaded={loaded}
     error={error}
     onRefresh={() => { void load(); }}
     onEdit={setEditor}
   />
   <div className="hidden md:block">
 return <div className="owner-calendar-home min-h-screen bg-[#141413] px-3 pb-14 pt-5 text-[#f3ece1] sm:px-6 sm:pt-7 2xl:px-8">
   <div className="mx-auto max-w-[1720px] space-y-5">
     <header className="flex flex-wrap items-end justify-between gap-4">
       <div>
         <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d6b779]">Car Dash / Business overview</p>
         <h2 className="mt-1 text-2xl font-semibold tracking-[-.045em] text-[#f5eee4] sm:text-3xl">Your workspace</h2>
         <p className="mt-2 text-xs text-[#b8ada0]">Bookings, your team, customer activity and the full schedule in one place.</p>
       </div>
       <div className="flex flex-wrap items-center gap-2">
         {lastUpdated&&<span className="hidden text-[11px] text-[#9f9589] sm:inline">Updated {lastUpdated}</span>}
         <button type="button" onClick={()=>void load()} className="rounded-xl border border-white/15 bg-[#262522] px-4 py-2.5 text-xs font-semibold text-[#ddd1bf] hover:border-[#d6b779]/50">Refresh</button>
         <a href="/owner/bookings?create=1" className="inline-flex items-center gap-2 rounded-xl bg-[#d6b779] px-4 py-2.5 text-xs font-bold text-[#171715] hover:bg-[#ead19a]">
           <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
           New booking
         </a>
       </div>
     </header>
     {error&&<div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#b88d61]/40 bg-[#3b2d20] p-3 text-sm text-[#f6dec0]">
       {error}<button type="button" onClick={()=>void load()} className="font-semibold underline">Retry</button></div>}
     <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-label="Business summary">
       {metrics.map((metric,index)=><div key={metric.label}
         className={"rounded-2xl border p-4 sm:p-5 "+(index===1&&pending.length?"border-[#bd9961]/40 bg-[#29241d]":"border-white/10 bg-[#201f1e]")}>
         <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-medium leading-4 text-[#bdb3a6]">{metric.label}</p>
           <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#d6b779]/20 bg-[#d6b779]/[.07] text-[#d6b779]"><OwnerAppIcon name={metric.icon} className="h-[17px] w-[17px]"/></span>
         </div>
         <p className="mt-3 text-2xl font-semibold tabular-nums tracking-[-.05em] text-[#f6efdf] sm:text-3xl">{loaded?metric.value:"—"}</p>
         <p className="mt-1 text-[10px] leading-4 text-[#9c9387]">{metric.meta}</p>
       </div>)}
     </section>
     <div className="grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_310px]">
       <div className="min-w-0">
         <OwnerScheduleOverview bookings={data.bookings} tasks={data.tasks} loading={!loaded} onEditBooking={setEditor} initialDate={today}/>
       </div>
       <aside className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-1" aria-label="Day planner and customer activity">
         <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#201f1e]">
           <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
             <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#d6b779]">Up next</p><h3 className="mt-1 text-base font-semibold">Upcoming jobs</h3></div>
             <a href="/owner/bookings" className="text-[11px] font-semibold text-[#d6b779]">See all</a>
           </div>
           <div className="divide-y divide-white/10">
             {nextJobs.length?nextJobs.map(b=><button key={b.id} onClick={()=>setEditor(b)}
               className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/[.035]">
               <span className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-[#d6b779]/20 bg-[#d6b779]/10 px-1 py-2 text-center">
                 <span className="text-[10px] font-semibold text-[#dcc092]">{b.preferredDate?dateLabel(b.preferredDate):"TBD"}</span>
               </span>
               <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#f3e9d9]">{b.customerName}</span>
                 <span className="mt-1 block truncate text-[11px] text-[#aca395]">{b.serviceName}</span>
                 <span className="mt-1 block text-[10px] text-[#cdb58a]">{niceTime(b.preferredTime)}</span>
               </span>
               <OwnerAppIcon name="chevron-right" className="mt-2 h-4 w-4 shrink-0 text-[#d6b779]"/>
             </button>):<p className="px-4 py-6 text-xs text-[#aba397]">No upcoming bookings.</p>}
           </div>
         </section>
         <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#201f1e]">
           <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
             <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#d6b779]">Customer updates</p><h3 className="mt-1 text-base font-semibold">Activity</h3></div>
             <a href="/owner/messages" className="text-[11px] font-semibold text-[#d6b779]">Inbox</a>
           </div>
           <div className="divide-y divide-white/10">
             {activity.length?activity.map(item=><a href={item.href} key={item.id} className="block px-4 py-3.5 transition hover:bg-white/[.035]">
               <div className="flex items-start justify-between gap-2">
                 <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#eee5d8]">{item.title}</p>
                 <span className="shrink-0 text-[10px] text-[#9d9488]">{stamp(item.time)}</span>
               </div>
               <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#b2a99e]">{item.detail}</p>
             </a>):<p className="px-4 py-6 text-xs text-[#aba397]">No recent activity.</p>}
           </div>
         </section>
         <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#201f1e] sm:col-span-2 2xl:col-span-1">
           <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
             <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#d6b779]">Operations</p><h3 className="mt-1 text-base font-semibold">Tasks to handle</h3></div>
             <a href="/owner/schedule" className="text-[11px] font-semibold text-[#d6b779]">Planner</a>
           </div>
           <div className="space-y-2 p-4">
             {[...overdueTasks,...soonTasks].length?[...overdueTasks,...soonTasks].map(t=><a key={t.id} href={"/owner/schedule?editTask="+encodeURIComponent(t.id)}
               className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-[#2a2926] px-3 py-2.5 hover:border-[#d6b779]/40">
               <p className="text-xs font-medium text-[#e9ded0]">{t.title}</p>
               <time className={"shrink-0 text-[10px] "+(t.date<today?"text-[#f2b5a6]":"text-[#cbb58e]")}>{dateLabel(t.date)}</time>
             </a>):<p className="text-xs text-[#aba397]">No open tasks. Plan your next service or follow-up.</p>}
           </div>
         </section>
       </aside>
     </div>
     <section className="rounded-2xl border border-white/10 bg-[#1d1c1a] p-4 sm:p-5">
       <div className="flex flex-wrap items-end justify-between gap-3">
         <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#d6b779]">Business management</p><h3 className="mt-1 text-xl font-semibold tracking-tight">Everything you need to run Car Dash</h3></div>
         <a href="/owner/analytics" className="text-xs font-semibold text-[#d6b779]">Business analytics</a>
       </div>
       <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
         {actions.map(a=><a key={a.href} href={a.href} className="group rounded-xl border border-white/10 bg-[#272521] p-3.5 transition hover:border-[#d6b779]/50 hover:bg-[#302b22]">
           <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6b779]/20 text-[#d6b779]"><OwnerAppIcon name={a.icon} className="h-4.5 w-4.5"/></span>
           <p className="mt-3 text-xs font-semibold leading-5 text-[#f1e7d9]">{a.title}</p>
           <p className="mt-1 text-[10px] leading-4 text-[#a9a092]">{a.detail}</p>
         </a>)}
       </div>
     </section>
     <p className="pb-4 text-[10px] text-[#8f877c]">Scheduled values are estimates from booking records, not verified payments. Manage invoices and actual collection in Payments.</p>
   </div>
 </div>
 </div>
   {editor&&<BookingDetailsEditor key={editor.id} booking={editor} onClose={()=>setEditor(null)} onSaved={load}/>}
 </>;
}
