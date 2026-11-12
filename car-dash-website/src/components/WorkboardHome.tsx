"use client";

import { useCallback, useEffect, useState } from "react";
import BookingDetailsEditor, { type EditableBooking } from "./BookingDetailsEditor";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";
import "./workboard.css";

function chicagoDate(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
const dateOf=(value:string)=>new Date(value+"T12:00:00");
function dayOf(date:Date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-")}
const money=(value:number)=>value.toLocaleString("en-US",{style:"currency",currency:"USD"});
type Props={owner:boolean;light:boolean;recording:boolean;permissions:string[];onMore:()=>void};
export default function WorkboardHome({owner,light,recording,permissions,onMore}:Props){
  const [today,setToday]=useState(chicagoDate),[selected,setSelected]=useState(today);
  const [bookings,setBookings]=useState<EditableBooking[]>([]),[state,setState]=useState("Loading bookings…");
  const [calendar,setCalendar]=useState(false);
  const [tasks,setTasks]=useState<OwnerScheduleTask[]>([]);
  const [plannerError,setPlannerError]=useState("");
  useEffect(()=>{
    if(!owner||recording)return;
    const controller=new AbortController();
    const refresh=async()=>{
      try{
        const response=await fetch("/api/owner-schedule",{cache:"no-store",signal:controller.signal});
        if(!response.ok)throw Error();
        const planner=await response.json();
        setTasks(planner.tasks||[]);setPlannerError("");
      }catch{if(!controller.signal.aborted)setPlannerError("Private activities could not be loaded.")}
    };
    void refresh();window.addEventListener("focus",refresh);
    return()=>{controller.abort();window.removeEventListener("focus",refresh)};
  },[owner,recording]);
  const dailyTasks=owner&&!recording?tasks.filter(task=>task.date===selected):[];
  const privateRows=<>{owner&&!recording&&plannerError&&<small>{plannerError}</small>}{dailyTasks.map(task=><button className="row" key={task.id} onClick={onMore}><b>{task.time}</b><span><strong>{task.title}</strong><small>Private activity</small></span></button>)}</>;
  const [editor,setEditor]=useState<EditableBooking|null>(null);
  const canBook=owner||permissions.includes("bookings"),canQuote=owner||permissions.includes("quoteChats");
  const bookingsPath=owner?"/owner/bookings":"/admin/bookings";
  const load=useCallback(async()=>{
    if(!canBook||recording)return;
    try{
      const response=await fetch("/api/bookings",{cache:"no-store"});
      if(!response.ok)throw Error();
      const result=await response.json();if(!Array.isArray(result))throw Error();
      setBookings(result);setState("");
      const now=chicagoDate();setToday(now);
    }catch{setState("Bookings could not be loaded.")}
  },[canBook,recording]);
  useEffect(()=>{void load();const timer=window.setInterval(()=>{if(!document.hidden)void load()},60000);window.addEventListener("focus",load);return()=>{window.clearInterval(timer);window.removeEventListener("focus",load)}},[load]);
  const notice=recording?"Customer details are hidden in recording mode.":!canBook?"Booking access is limited for this account.":state;
  const available=bookings.filter(b=>!/^cancelled$|^canceled$/i.test(b.status||""));
  const todays=available.filter(b=>b.preferredDate===today),active=available.filter(b=>/in[ _-]?progress|^started$|^active$/i.test(b.status||""));
  const scheduled=available.filter(b=>b.preferredDate===selected).sort((a,b)=>(a.preferredTime||"").localeCompare(b.preferredTime||""));
  const visit=(url:string)=>window.location.assign(url);
  function rows(jobs:EditableBooking[],empty:string){if(notice||!jobs.length)return <div className="empty">{notice||empty}</div>;return jobs.map(j=><button className="row" key={j.id} onClick={()=>setEditor(j)}><b>{j.preferredTime||"TBD"}</b><span><strong>{j.customerName}</strong><small>{[j.vehicleYear,j.vehicleMake,j.vehicleModel].filter(Boolean).join(" ")} · {j.serviceName}</small></span><small>{j.status}</small></button>)}
  const start=dateOf(selected);start.setDate(start.getDate()-start.getDay());
  function quick(title:string,sub:string,fn:()=>void){return <button className="quick" onClick={fn}><span><strong>{title}</strong><br/><small>{sub}</small></span></button>}
  const year=dateOf(selected).getFullYear(),month=dateOf(selected).getMonth();
  function moveMonth(amount:number){setSelected(dayOf(new Date(year,month+amount,1)))}
  return <><div className={"cd-workboard"+(light?" light":"")}>
    <div className="daily-overview">
      <div className="daily-heading">
        <div><p className="cap">{dateOf(today).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
          <h2>{calendar ? "Booking calendar" : "Daily overview"}</h2></div>
        <div className="daily-switch" aria-label="Schedule view">
          <button aria-pressed={!calendar} onClick={()=>{setCalendar(false);setSelected(today)}}>Overview</button>
          <button aria-pressed={calendar} onClick={()=>setCalendar(true)}>Calendar</button>
        </div>
      </div>
    {calendar?<section className="box" style={{marginTop:18}}><div className="head"><button onClick={()=>moveMonth(-1)}>Prev</button><h2>{dateOf(selected).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2><button onClick={()=>moveMonth(1)}>Next</button></div><div className="month">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><small key={d}>{d}</small>)}{Array.from({length:new Date(year,month,1).getDay()},(_,i)=><i key={"blank"+i}/>)}{Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>{const key=dayOf(new Date(year,month,i+1));const dayJobs=available.filter(b=>b.preferredDate===key);
      const monthly=dayJobs.filter(b=>b.id.startsWith("monthly-")).length;
      const regular=dayJobs.length-monthly;
      const privateCount=owner?tasks.filter(task=>task.date===key).length:0;
      const labels=notice?[]:[
        regular && (regular===1?"1 booking":regular+" bookings"),
        monthly && (monthly===1?"Monthly plan":monthly+" monthly plans"),
        privateCount && (privateCount===1?"Private activity":privateCount+" private activities")
      ].filter((label):label is string=>typeof label==="string");
      return <button key={key} aria-pressed={key===selected} aria-label={[dateOf(key).toLocaleDateString("en-US",{month:"long",day:"numeric"}),...labels].join(", ")} className={key===selected?"on":""} onClick={()=>setSelected(key)}>{i+1}{labels.map(label=><small key={label} style={{display:"block",fontSize:"clamp(9px,1.2vw,12px)",lineHeight:1.2,whiteSpace:"normal",overflowWrap:"anywhere",color:"inherit"}}>{label}</small>)}</button>})}</div><h3>{dateOf(selected).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</h3>{rows(scheduled,dailyTasks.length?"":"No bookings scheduled.")}{privateRows}<button onClick={onMore}>Open detailed dashboard</button></section>:<><div className="stats">{[["Active jobs",active.length],["Today’s bookings",todays.length],["Today’s booked value",money(todays.reduce((sum,b)=>sum+Number(b.quotedPrice||0),0))]].map(([title,value])=><div className="stat" key={title}><span className="cap">{title}</span><b>{notice?"—":value}</b></div>)}</div>
    <div className="grid"><div><section className="box"><div className="head"><h2>Job schedule</h2><button onClick={()=>setCalendar(true)}>Calendar</button></div><div className="week">{Array.from({length:7},(_,i)=>{const date=new Date(start);date.setDate(date.getDate()+i);const key=dayOf(date);return <button key={key} className={key===selected?"on":""} onClick={()=>setSelected(key)}><small>{date.toLocaleDateString("en-US",{weekday:"short"})}</small>{date.getDate()}</button>})}</div><div className="cap">{dateOf(selected).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>{rows(scheduled,dailyTasks.length?"":"No jobs scheduled. Choose a date or add a booking.")}{privateRows}</section><br/><section className="box"><h2>Active jobs</h2>{rows(active,"Jobs marked in progress will appear here.")}</section></div>
    <section className="box" style={{alignSelf:"start"}}><h2>Quick actions</h2>{canQuote&&quick(owner?"Create estimate":"Quotes",owner?"Price a detail and estimate profit":"Review customer quotes",()=>visit(owner?"/owner/detail-builder":"/admin/quotes"))}{owner&&quick("Find a customer","Vehicles and job history",()=>visit("/owner/crm"))}{canBook&&quick("Previous bookings","View past jobs and customer details",()=>visit(bookingsPath))}{!owner&&permissions.includes("loyalty")&&quick("Loyalty cards","Record visits and redeem rewards",()=>visit("/owner/loyalty"))}{(owner || permissions.includes("maintenance")) && quick("Monthly plans","Record cash payments and review the next visit",()=>visit("/owner/maintenance/cash"))}{quick("Detailed dashboard","Open the full schedule and workspace overview",onMore)}</section></div></>}</div></div>
    {editor&&!recording&&canBook&&<BookingDetailsEditor booking={editor} onClose={()=>setEditor(null)} onSaved={load}/>}</>
}
