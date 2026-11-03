"use client";

import { useMemo } from "react";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";
import { bookingServiceAddress } from "@/lib/booking-owner-details";
import OwnerPrivacyControls from "@/components/OwnerPrivacyControls";
import { useOwnerScreenPrivacy, normalizeContactPhone, safeCustomerText, type ContactAliases } from "@/lib/owner-screen-privacy";
import type { EditableBooking } from "@/components/BookingDetailsEditor";

type Activity = { id:string; kind:string; title:string; detail:string; href:string; time:string };
type MobileProps = {
  bookings: EditableBooking[];
  activity: Activity[];
  unread: number;
  today: string;
  loaded: boolean;
  error: string;
  onRefresh: () => void;
  onEdit: (booking: EditableBooking) => void;
};
type Tab = { label:string; href:string; icon:OwnerIconName };
const TABS:Tab[] = [
  { label:"Today", href:"/owner/dashboard", icon:"activity" },
  { label:"Calendar", href:"/owner/schedule", icon:"calendar" },
  { label:"Routes", href:"#today-route", icon:"map-pin" },
  { label:"SMS", href:"/owner/messages", icon:"message" },
  { label:"Customers", href:"/owner/crm", icon:"users" },
];
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const timestamp=(value:string)=>new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const time=(value?:string|null)=>{
 const parts=String(value||"").match(/^(\d{1,2}):(\d{2})/);
 if(!parts||Number(parts[1])>23||Number(parts[2])>59)return "Time TBD";
 const h=Number(parts[1]);
 return (h%12||12)+":"+parts[2]+" "+(h>=12?"PM":"AM");
};
const when=(iso:string)=>{
 const [year,month,day]=iso.split("-").map(Number);
 return new Date(year,month-1,day,12).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
};
function clockChicago(){
 return new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());
}
function greet(){
 const hour=Number(new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",hourCycle:"h23"}).format(new Date()));
 return hour<12?"Good morning.":hour<17?"Good afternoon.":"Good evening.";
}
const active=(booking:EditableBooking)=>!["cancelled","canceled"].includes((booking.status||"").toLowerCase());
const finished=(booking:EditableBooking)=>(booking.status||"").toLowerCase()==="completed";
const statusStyle=(status?:string)=>{
 const value=(status||"").toLowerCase();
 if(value==="completed")return "border-[#719981]/35 bg-[#27382d] text-[#c7e0cd]";
 if(["confirmed","approved","accepted"].includes(value))return "border-[#d6b779]/35 bg-[#373020] text-[#f2d8a3]";
 if(["cancelled","canceled"].includes(value))return "border-white/10 bg-[#292929] text-[#afa59b]";
 return "border-[#b38b5d]/35 bg-[#382b23] text-[#e8c19d]";
};
function mapsUrl(address:string){
 return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address);
}
function routeUrl(addresses:string[]){
 if(!addresses.length)return null;
 const selected=addresses.slice(0,4);
 const destination=selected[selected.length-1];
 const params=new URLSearchParams({api:"1",destination,travelmode:"driving"});
 if(selected.length>1)params.set("waypoints",selected.slice(0,-1).join("|"));
 return "https://www.google.com/maps/dir/?"+params.toString();
}

function MobileStop({
 booking,index,onEdit,recording,aliases,
}:{
 booking:EditableBooking;index:number;onEdit:(booking:EditableBooking)=>void;
 recording:boolean;aliases:ContactAliases;
}){
 const address=bookingServiceAddress(booking.notes);
 const phone=(booking.customerPhone||"").trim();
 const label=booking.status||"Requested";
 const displayName=recording?"Client "+(index+1):safeCustomerText(aliases[normalizeContactPhone(phone)]||booking.customerName||"Customer",aliases);
 return <article className="rounded-2xl border border-white/[.09] bg-[#201f1d] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
   <div className="flex items-start gap-3">
     <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d6b779]/40 bg-[#d6b779]/10 text-sm font-bold text-[#e8cf9e]">{index+1}</div>
     <div className="min-w-0 flex-1">
       <div className="flex flex-wrap items-center justify-between gap-2">
         <p className="text-sm font-semibold text-[#f7efe2]">{time(booking.preferredTime)}</p>
         {booking.quotedPrice!=null&&<p className="text-sm font-semibold tabular-nums text-[#e7cf9f]">{money(Number(booking.quotedPrice))}</p>}
       </div>
       <h4 className="mt-1 text-base font-semibold tracking-tight text-[#f4ede1]">{displayName}</h4>
       <p className="mt-1 text-xs leading-5 text-[#bdb2a3]">{recording?"Detailing appointment":safeCustomerText(booking.serviceName||"Detailing service",aliases)}</p>
       <span className={"mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize "+statusStyle(booking.status)}>{label}</span>
       <p className={"mt-3 flex items-start gap-1.5 text-xs leading-5 "+(address?"text-[#c9bdb0]":"text-[#efd1a1]")}>
         <OwnerAppIcon name="map-pin" className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
         <span>{recording?"Address hidden for recording":address||"Service address missing — edit booking"}</span>
       </p>
     </div>
   </div>
   <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[.085] pt-3">
     {recording?<button type="button" disabled title="Turn off Recording mode to view customer conversations"
       className="flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-[#282622] px-2 py-2 text-[11px] text-[#968c80]">Hidden</button>
     :phone?<a href={"/owner/messages?phone="+encodeURIComponent(phone)+"&name="+encodeURIComponent(booking.customerName||"Customer")}
       className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#2a2824] px-2 py-2 text-[11px] font-semibold text-[#e9dcc6]">
       <OwnerAppIcon name="message" className="h-3.5 w-3.5"/> Text
     </a>:<button type="button" onClick={()=>onEdit(booking)} className="rounded-lg border border-[#a38156]/30 px-2 py-2 text-[11px] text-[#e4c89c]">Add phone</button>}
     {recording?<button type="button" disabled title="Turn off Recording mode to open a customer address"
       className="flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-[#282622] px-2 py-2 text-[11px] text-[#968c80]">Hidden</button>
     :address?<a href={mapsUrl(address)} target="_blank" rel="noopener noreferrer"
       className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#2a2824] px-2 py-2 text-[11px] font-semibold text-[#e9dcc6]">
       <OwnerAppIcon name="map-pin" className="h-3.5 w-3.5"/> Maps
     </a>:<button type="button" onClick={()=>onEdit(booking)} className="rounded-lg border border-[#a38156]/30 px-2 py-2 text-[11px] text-[#e4c89c]">Add address</button>}
     <button type="button" onClick={()=>onEdit(booking)} disabled={recording} title={recording?"Turn off Recording mode to edit":undefined}
       className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d6b779]/35 bg-[#d6b779]/10 px-2 py-2 text-[11px] font-semibold text-[#e9ce99]">
       <OwnerAppIcon name="receipt" className="h-3.5 w-3.5"/> Edit
     </button>
   </div>
 </article>;
}

export default function MobileOwnerDashboard({
  bookings,activity,unread,today,loaded,error,onRefresh,onEdit,
}:MobileProps){
 const {recording,aliases}=useOwnerScreenPrivacy();
 const displayAliases=useMemo(()=>{
   const known:ContactAliases={};
   for(const b of bookings){
     const normalized=normalizeContactPhone(b.customerPhone||"");
     const customer=b.customerName?.trim();
     if(normalized&&customer&&!/[+()]/.test(customer)&&!/^\d+$/.test(customer))known[normalized]=customer;
   }
   return {...known,...aliases};
 },[bookings,aliases]);
 const todaysJobs=useMemo(()=>bookings.filter(b=>b.preferredDate===today&&active(b))
  .sort((a,b)=>(a.preferredTime||"99:99").localeCompare(b.preferredTime||"99:99")),[bookings,today]);
 const upcoming=useMemo(()=>bookings.filter(b=>b.preferredDate && b.preferredDate>=today && active(b)&&!finished(b))
  .sort((a,b)=>(a.preferredDate||"").localeCompare(b.preferredDate||"")||(a.preferredTime||"99:99").localeCompare(b.preferredTime||"99:99")),[bookings,today]);
 const current=clockChicago();
 const nextJob=upcoming.find(b=>b.preferredDate!>today||(b.preferredTime||"99:99")>=current)||upcoming[0]||null;
 const pending=bookings.filter(b=>["pending","requested"].includes((b.status||"").toLowerCase())).length;
 const completed=todaysJobs.filter(finished).length;
 const bookedToday=todaysJobs.reduce((sum,b)=>sum+Math.max(0,Number(b.quotedPrice)||0),0);
 const todayAddresses=todaysJobs.filter(b=>!finished(b)).map(b=>bookingServiceAddress(b.notes)).filter(Boolean);
 const withoutAddress=todaysJobs.filter(b=>!finished(b)&&!bookingServiceAddress(b.notes)).length;
 const directions=routeUrl(todayAddresses);
 const statItems:{title:string;value:string;subtitle:string;icon:OwnerIconName;href:string}[]=[
   {title:"Appointments today",value:String(todaysJobs.length),subtitle:completed+" completed",icon:"calendar",href:"#today-route"},
   {title:"Booked today",value:money(bookedToday),subtitle:"Estimated · not collected",icon:"receipt",href:"/owner/invoices"},
   {title:"Unread messages",value:String(unread),subtitle:"Saved customer conversations",icon:"message",href:"/owner/messages"},
   {title:"Pending bookings",value:String(pending),subtitle:"Review and confirm",icon:"quote",href:"/owner/bookings"},
 ];
 return <div className="owner-mobile-home min-h-screen bg-[#121211] px-4 pb-24 pt-5 text-[#f2ece2] md:hidden"
   style={{paddingBottom:"calc(104px + env(safe-area-inset-bottom))"}}>
   <div className="mx-auto max-w-lg space-y-5">
     <section>
       <p className="text-xs font-medium tracking-[.035em] text-[#b9afa2]">{when(today)}</p>
       <h1 className="mt-2 text-[29px] font-semibold leading-[1.12] tracking-[-.045em] text-[#f5eee4]">{greet()}</h1>
       <p className="mt-2 text-sm text-[#a99f91]">Here’s what’s happening with Car Dash today.</p>
       <div className="mt-5 flex items-center gap-2">
         <a href="#today-route" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d6b779]/35 bg-[#29251e] px-3 text-xs font-semibold text-[#e7d1a3]">
           <OwnerAppIcon name="map-pin" className="h-4 w-4"/> Today’s stops
         </a>
         <a href="/owner/bookings?create=1" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#d6b779] px-3 text-xs font-bold text-[#181714]">
           <OwnerAppIcon name="plus" className="h-4 w-4"/> New appointment
         </a>
       </div>
     </section>

     {error&&<div role="alert" className="rounded-xl border border-[#bc8c65]/35 bg-[#32271f] p-3 text-xs leading-5 text-[#f2d8b7]">
       {error} <button type="button" onClick={onRefresh} className="font-bold underline">Retry</button>
     </div>}

     <OwnerPrivacyControls bookings={bookings} activity={activity}/>

     <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3">
       {statItems.map(item=><a key={item.title} href={item.href}
         className="min-h-[135px] rounded-[20px] border border-white/[.095] bg-[#1d1d1c] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
         <div className="flex items-center gap-2 text-[#cbbfae]">
           <OwnerAppIcon name={item.icon} className="h-[17px] w-[17px] text-[#d6b779]"/>
           <p className="text-[11px] font-medium leading-4">{item.title}</p>
         </div>
         <p className="mt-4 text-[27px] font-semibold leading-none tracking-[-.055em] tabular-nums text-[#f5eee2]">{loaded?item.value:"—"}</p>
         <p className="mt-2 text-[10px] leading-[1.45] text-[#a69c8e]">{item.subtitle}</p>
       </a>)}
     </section>

     <section id="today-route" className="scroll-mt-24 rounded-[22px] border border-white/[.105] bg-[#1a1a19] p-4">
       <div className="flex items-start justify-between gap-3">
         <div><p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Today’s route</p>
           <h2 className="mt-1 text-lg font-semibold tracking-tight">Appointments & stops</h2></div>
         <a href="/owner/schedule" className="flex items-center gap-1.5 py-1 text-xs font-semibold text-[#d8c393]">Calendar <OwnerAppIcon name="chevron-right" className="h-3.5 w-3.5"/></a>
       </div>
       <div className="mt-3 flex flex-wrap items-center gap-2">
         <span className="rounded-full border border-[#d6b779]/25 bg-[#302a21] px-2.5 py-1 text-[10px] font-semibold text-[#dfc79a]">{todaysJobs.length} jobs</span>
         <span className="rounded-full border border-white/10 bg-[#282724] px-2.5 py-1 text-[10px] text-[#c7bcb0]">{completed} completed</span>
         {withoutAddress>0&&<span className="rounded-full border border-[#aa7c4a]/35 bg-[#3b2b20] px-2.5 py-1 text-[10px] text-[#eed2a5]">{withoutAddress} need addresses</span>}
       </div>
       <div className="mt-4 space-y-3">
         {!loaded?<div className="rounded-xl border border-white/10 bg-[#232221] p-6 text-center text-xs text-[#aaa092]">Loading appointments…</div>
         :todaysJobs.length?todaysJobs.map((booking,i)=><MobileStop key={booking.id} booking={booking} index={i} onEdit={onEdit} recording={recording} aliases={displayAliases}/>)
         :<div className="rounded-xl border border-white/10 bg-[#232221] px-5 py-8 text-center">
           <OwnerAppIcon name="calendar" className="mx-auto h-8 w-8 text-[#d6b779]"/>
           <p className="mt-3 text-sm font-semibold">No appointments scheduled today</p>
           <p className="mt-1 text-xs text-[#afa496]">Add a booking to start building today’s route.</p>
           <a href="/owner/bookings?create=1" className="mt-4 inline-flex rounded-lg border border-[#d6b779]/40 px-4 py-2.5 text-xs font-semibold text-[#e7d0a2]">Create booking</a>
         </div>}
       </div>
       {!recording&&directions&&<div className="mt-3">
         <a href={directions} target="_blank" rel="noopener noreferrer"
           className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d6b779]/40 bg-[#2a261f] text-xs font-bold text-[#e7ce9f]">
           <OwnerAppIcon name="map-pin" className="h-4 w-4"/> Open {todayAddresses.length>4?"first four stops":"today’s stops"} in Maps
         </a>
         <p className="mt-2 text-[10px] leading-5 text-[#a69c8e]">Directions use appointment order, not optimized travel times. Stops missing addresses are excluded.</p>
       </div>}
     </section>

     <section className="rounded-[22px] border border-white/[.105] bg-[#1a1a19] p-4">
       <div className="flex items-center justify-between">
         <div><p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Next up</p>
           <h2 className="mt-1 text-lg font-semibold tracking-tight">Your next appointment</h2></div>
         <a href="/owner/bookings" className="text-xs font-semibold text-[#d8c393]">View all</a>
       </div>
       {!loaded?<p className="mt-4 text-xs text-[#aaa092]">Checking upcoming jobs…</p>
       :nextJob?<div className="mt-4">
         <p className="mb-2 text-[11px] font-semibold text-[#d6b779]">{nextJob.preferredDate===today?"Today":nextJob.preferredDate?timestamp(nextJob.preferredDate+"T12:00:00"):"Unscheduled"}</p>
         <MobileStop booking={nextJob} index={upcoming.indexOf(nextJob)} onEdit={onEdit} recording={recording} aliases={displayAliases}/>
       </div>:<p className="mt-4 rounded-xl border border-white/10 bg-[#232221] p-5 text-xs text-[#aaa092]">No upcoming appointment yet.</p>}
     </section>

     {activity.length>0&&<section className="rounded-[22px] border border-white/[.105] bg-[#1a1a19] p-4">
       <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Recent customer activity</h2>
         <a href="/owner/messages" className="text-xs font-semibold text-[#d8c393]">Messages</a>
       </div>
       <div className="mt-3 divide-y divide-white/10">
         {activity.slice(0,3).map(item=>recording?<div key={item.id} className="py-3">
           <p className="text-xs font-semibold text-[#ede4d8]">New Car Dash activity</p>
           <p className="mt-1 text-[11px] text-[#b5a99b]">Customer details hidden during recording.</p>
         </div>:<a key={item.id} href={item.href} className="block py-3">
           <p className="line-clamp-1 text-xs font-semibold text-[#ede4d8]">{safeCustomerText(item.title,displayAliases)}</p>
           <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#b5a99b]">{safeCustomerText(item.detail,displayAliases)}</p>
         </a>)}
       </div>
     </section>}
     <p className="px-1 text-center text-[10px] leading-5 text-[#8f8577]">Booked totals are estimates, not payments collected.</p>
   </div>

   <nav aria-label="Mobile owner navigation"
     className="fixed inset-x-0 bottom-0 z-[55] border-t border-[#d6b779]/20 bg-[#181817]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-2xl"
     style={{paddingBottom:"max(10px, env(safe-area-inset-bottom))"}}>
     <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
       {TABS.map((tab,i)=><a key={tab.label} href={tab.href} aria-current={i===0?"page":undefined}
         className={"flex min-h-[53px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center transition "+
           (i===0?"text-[#e6c98f]":"text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]")}>
         <OwnerAppIcon name={tab.icon} className="h-5 w-5"/>
         <span className="text-[10px] font-semibold">{tab.label}</span>
       </a>)}
     </div>
   </nav>
 </div>;
}
