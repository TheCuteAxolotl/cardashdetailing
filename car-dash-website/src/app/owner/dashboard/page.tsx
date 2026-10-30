"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string; serviceName?: string; customerName?: string;
  vehicleMake?:string;vehicleModel?:string; preferredDate?:string|null;preferredTime?:string|null;
  status?:string;quotedPrice?:number|null;createdAt?:string;
};
type Activity={id:string;kind:string;title:string;detail:string;href:string;time:string};
type Metrics={bookings:Booking[];unread:number;activity:Activity[]};

const tools = [
  {title:"Calendar",href:"/owner/schedule",description:"Jobs and availability",symbol:"▦"},
  {title:"Clients & bookings",href:"/owner/bookings",description:"Appointments and addresses",symbol:"◉"},
  {title:"Messages",href:"/owner/messages",description:"Your complete SMS history",symbol:"✉"},
  {title:"Quotes",href:"/owner/quotes",description:"Review and convert leads",symbol:"✦"},
  {title:"Invoices",href:"/owner/invoices",description:"Create and collect payment",symbol:"▤"},
  {title:"Detail calculator",href:"/owner/estimate-calculator",description:"Price and time estimates",symbol:"⌗"},
  {title:"Training guides",href:"/owner/service-guides",description:"Step-by-step procedures",symbol:"☷"},
  {title:"Analytics",href:"/owner/analytics",description:"Performance and results",symbol:"↗"},
  {title:"Gift cards",href:"/owner/gift-cards",description:"Balances and redemption",symbol:"◇"},
  {title:"Website",href:"/owner/website",description:"Content and photos",symbol:"◫"},
];
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const dayId=(d:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
const niceDate=(value:string)=>new Date(value+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const timeLabel=(value?:string|null)=>{
 if(!value)return "Time TBD";
 const match=value.match(/^(\d{1,2}):(\d{2})/);
 if(!match)return value;
 const hours=Number(match[1]);return (hours%12||12)+":"+match[2]+(hours>=12?" PM":" AM");
};

export default function OwnerDashboard(){
 const [data,setData]=useState<Metrics>({bookings:[],unread:0,activity:[]});
 const [loaded,setLoaded]=useState(false);
 const [tab,setTab]=useState<"today"|"upcoming">("today");
 const today=useMemo(()=>dayId(new Date()),[]);
 const greeting=useMemo(()=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"long",month:"long",day:"numeric"}).format(new Date()),[]);
 useEffect(()=>{
  let cancelled=false;
  const run=async()=>{
   const [bookings,sms,activity]=await Promise.allSettled([
    fetch("/api/bookings",{cache:"no-store"}).then(async r=>r.ok?r.json():[]),
    fetch("/api/sms/inbox",{cache:"no-store"}).then(async r=>r.ok?r.json():null),
    fetch("/api/owner/activity",{cache:"no-store"}).then(async r=>r.ok?r.json():null),
   ]);
   if(cancelled)return;
   setData({
    bookings:bookings.status==="fulfilled"&&Array.isArray(bookings.value)?bookings.value:[],
    unread:sms.status==="fulfilled"?Number(sms.value?.totalUnread||0):0,
    activity:activity.status==="fulfilled"&&Array.isArray(activity.value?.alerts)?activity.value.alerts:[],
   });
   setLoaded(true);
  };
  void run();
  const interval=setInterval(()=>{if(!document.hidden)void run()},45000);
  return()=>{cancelled=true;clearInterval(interval)};
 },[]);
 const upcoming=useMemo(()=>data.bookings.filter(b=>b.preferredDate&&b.preferredDate>=today&&!["cancelled","completed"].includes((b.status||"").toLowerCase()))
   .sort((a,b)=>(a.preferredDate||"").localeCompare(b.preferredDate||"")||(a.preferredTime||"").localeCompare(b.preferredTime||"")),[data.bookings,today]);
 const todayBookings=upcoming.filter(b=>b.preferredDate===today);
 const visibleBookings=tab==="today"?todayBookings:upcoming.slice(0,5);
 const active=data.bookings.filter(b=>!["cancelled","completed"].includes((b.status||"").toLowerCase()));
 const pending=active.filter(b=>(b.status||"").toLowerCase()==="pending");
 const completed=data.bookings.filter(b=>(b.status||"").toLowerCase()==="completed");
 const bookedValue=active.reduce((sum,b)=>sum+Number(b.quotedPrice||0),0);
 const completedValue=completed.reduce((sum,b)=>sum+Number(b.quotedPrice||0),0);
 const spotlight=data.activity.slice(0,4);

 return <div className="owner-app-home min-h-screen px-4 pb-16 pt-6 sm:px-7 sm:pt-8 xl:px-10">
  <div className="mx-auto max-w-[1360px]">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#e9ab73]"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#e58b4b] shadow-[0_0_14px_#e58b4b]"/>Car Dash business command center</p>
     <h2 className="mt-3 font-sans text-3xl font-semibold tracking-[-.055em] text-[#f5f0e8] sm:text-5xl">Today, at a glance.</h2>
     <p className="mt-2 text-sm text-[#b8b2aa]">{greeting} <span className="mx-2 text-[#746f67]">/</span> Bookings, conversations, and what needs your attention.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <a href="/owner/bookings" className="rounded-xl border border-[#e58b4b]/60 bg-[#e58b4b] px-4 py-3 text-sm font-semibold text-[#131210] shadow-[0_8px_25px_#e58b4b20]">+ New appointment</a>
      <a href="/owner/schedule" className="rounded-xl border border-white/20 bg-[#25231f] px-4 py-3 text-sm font-semibold text-[#f4eee6]">View calendar →</a>
    </div>
   </div>

   <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Current business metrics">
    {[
      {label:"Active bookings",value:active.length,detail:"Appointments in progress",symbol:"▦"},
      {label:"Awaiting confirmation",value:pending.length,detail:"Requests needing review",symbol:"✦"},
      {label:"Unread messages",value:data.unread,detail:"Customer conversations",symbol:"✉"},
      {label:"Booked value",value:money(bookedValue),detail:"Scheduled and pending · not paid",symbol:"↗"},
    ].map((item,i)=><div key={item.label} className={"owner-metric-card group rounded-2xl border p-5 "+(i===1&&pending.length?"border-[#e58b4b]/45 bg-[#2b241e]":"border-white/10 bg-[#20201f]")}>
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-[#bbb5ab]">{item.label}</span><span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-lg text-[#e6a56e]">{item.symbol}</span></div>
      <p className="mt-5 text-[clamp(27px,3vw,40px)] font-semibold tracking-[-.055em] tabular-nums text-[#f5f0e8]">{loaded?item.value:"—"}</p>
      <p className="mt-1 text-[11px] text-[#999389]">{item.detail}</p>
    </div>)}
   </section>

   <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1d]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#e9ab73]">Schedule</p><h3 className="mt-1 text-xl font-semibold text-[#f4efe5]">Appointments</h3></div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#151514] p-1">
          <button onClick={()=>setTab("today")} className={"rounded-lg px-3 py-2 text-xs font-semibold "+(tab==="today"?"bg-[#e58b4b] text-[#18120e]":"text-[#bcb6ac]")}>Today</button>
          <button onClick={()=>setTab("upcoming")} className={"rounded-lg px-3 py-2 text-xs font-semibold "+(tab==="upcoming"?"bg-[#e58b4b] text-[#18120e]":"text-[#bcb6ac]")}>Upcoming</button>
        </div>
      </div>
      <div className="min-h-[230px] divide-y divide-white/[.075]">
       {visibleBookings.length?visibleBookings.map(b=><a href="/owner/bookings" key={b.id} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[.045] sm:px-6">
         <div className="w-[67px] shrink-0 border-r border-white/10 pr-3 text-center"><p className="text-sm font-bold text-[#e9ab73]">{timeLabel(b.preferredTime)}</p><p className="mt-1 text-[10px] text-[#aaa49c]">{niceDate(b.preferredDate!)}</p></div>
         <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#f4eee6]">{b.customerName||"Customer"}</p><p className="mt-1 truncate text-xs text-[#b5afa5]">{b.serviceName||"Detailing"}{b.vehicleMake?" · "+[b.vehicleMake,b.vehicleModel].filter(Boolean).join(" "):""}</p></div>
         <div className="flex items-center gap-2"><span className={"hidden rounded-full border px-2.5 py-1 text-[10px] font-medium sm:block "+(b.status==="pending"?"border-[#e58b4b]/40 text-[#f2bd8d]":"border-[#719988]/40 text-[#add4bf]")}>{b.status||"Booked"}</span><span className="text-[#e9ab73]">›</span></div>
       </a>):<div className="flex h-[230px] flex-col items-center justify-center p-7 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 text-2xl text-[#e58b4b]">▦</span><p className="mt-4 text-sm font-semibold">{loaded?"No appointments "+(tab==="today"?"today":"coming up"):"Checking schedule…"}</p><p className="mt-1 text-xs text-[#999389]">{loaded?"Use the calendar to add your next booking.":"Your bookings will appear here."}</p></div>}
      </div>
      <a href="/owner/schedule" className="block border-t border-white/10 px-5 py-3.5 text-center text-xs font-semibold text-[#e9ab73] hover:bg-white/[.04]">Open full calendar →</a>
    </section>

    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1d]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#e9ab73]">While you were away</p><h3 className="mt-1 text-xl font-semibold">Latest activity</h3></div><span className="relative flex h-2 w-2 rounded-full bg-[#e58b4b]"/></div>
      <div className="min-h-[230px] divide-y divide-white/[.075]">
       {spotlight.length?spotlight.map(item=><a key={item.id} href={item.href} className="block px-5 py-4 transition hover:bg-white/[.05] sm:px-6"><div className="flex justify-between gap-3"><p className="line-clamp-1 text-sm font-semibold text-[#f3ece1]">{item.title}</p><span className="shrink-0 text-xs text-[#e6a56e]">↗</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#aaa49a]">{item.detail}</p></a>):<p className="px-6 py-12 text-center text-sm text-[#aaa49a]">{loaded?"No recent customer activity.":"Loading activity…"}</p>}
      </div>
      <a href="/owner/messages" className="block border-t border-white/10 px-5 py-3.5 text-center text-xs font-semibold text-[#e9ab73] hover:bg-white/[.04]">Open customer messages →</a>
    </section>
   </div>

   <section className="mt-6 rounded-2xl border border-white/10 bg-[#1d1d1b] p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#e9ab73]">Quick launch</p><h3 className="mt-1 text-xl font-semibold">Your tools, one tap away.</h3></div>
      <a href="/owner/analytics" className="text-xs font-semibold text-[#e9ab73]">Detailed performance →</a>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tools.map(t=><a key={t.href} href={t.href} className="owner-tool-card group rounded-xl border border-white/10 bg-[#262522] p-4 transition hover:border-[#e58b4b]/50 hover:bg-[#2b2925]">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#e58b4b]/15 bg-[#e58b4b]/10 text-xl text-[#edae79]">{t.symbol}</span>
        <p className="mt-4 text-sm font-semibold text-[#f4efe5]">{t.title}</p>
        <p className="mt-1 text-[11px] leading-5 text-[#aaa49a]">{t.description}</p>
      </a>)}
    </div>
   </section>

   <footer className="mt-6 flex flex-wrap justify-between gap-3 px-1 text-xs text-[#969087]"><p>Car Dash Detailing · Owner workspace</p><p>Completed booking value: {loaded?money(completedValue):"—"} · Based on booked prices, not payment records</p></footer>
  </div>
 </div>;
}
