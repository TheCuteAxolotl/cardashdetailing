"use client";
import {useEffect,useState,type FormEvent} from "react";
import {chicagoDay,nextCashDue,nextService,prettyDay,weekdays,ordinals,type CashPlan,type ServiceSchedule} from "@/lib/cash-maintenance";
const usd=(n:number)=>(n/100).toLocaleString("en-US",{style:"currency",currency:"USD"});
const field="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-black/20 bg-white px-3 text-base text-black";
const button="rounded-xl bg-[#d6b779] px-4 py-3 font-semibold text-[#171411] disabled:opacity-50";
type DisplayPlan=CashPlan&{activationStatus?:string};
function ScheduleFields({existing}:{existing?:ServiceSchedule}){
  const [ordinal,setOrdinal]=useState(existing?.ordinal||1),[weekday,setWeekday]=useState(existing?.weekday??6),[startMonth,setMonth]=useState(existing?.startMonth||chicagoDay().slice(0,7));
  return <fieldset className="my-4 space-y-3"><legend className="font-semibold">Recurring detail</legend>
    <div className="grid gap-3 sm:grid-cols-2">
    <label>Week of month<select className={field} name="ordinal" value={ordinal} onChange={e=>setOrdinal(+e.target.value)}>{ordinals.map((v,i)=><option key={v} value={i+1}>{v}</option>)}</select></label>
    <label>Day of week<select className={field} name="weekday" value={weekday} onChange={e=>setWeekday(+e.target.value)}>{weekdays.map((v,i)=><option key={v} value={i}>{v}</option>)}</select></label>
    <label>Starting month<input className={field} name="startMonth" type="month" required value={startMonth} onChange={e=>setMonth(e.target.value)}/></label>
    <label>Reminder<select className={field} name="lead" defaultValue={existing?.lead||2}><option value={2}>2 days before</option><option value={1}>1 day before</option></select></label>
    {(["year","make","model"] as const).map(key=><label key={key}>Vehicle {key}<input className={field} name={key} required defaultValue={existing?.[key]} maxLength={key==="year"?4:80} pattern={key==="year"?"[0-9]{4}":undefined}/></label>)}<label>Customer mobile number<input className={field} type="tel" name="phone" defaultValue={existing?.phone} autoComplete="tel" required/></label></div>
    {/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)&&<p>Next detail: <strong>{prettyDay(nextService({ordinal,weekday,startMonth},chicagoDay()))}</strong></p>}
    <label className="flex items-start gap-2"><input type="checkbox" name="consent" required className="mt-1"/>Customer agreed to receive plan and appointment texts at this number.</label>
  </fieldset>
}
function scheduleFrom(form:HTMLFormElement){
  const data=new FormData(form);
  return {make:data.get("make"),model:data.get("model"),year:data.get("year"),ordinal:data.get("ordinal"),weekday:data.get("weekday"),startMonth:data.get("startMonth"),lead:data.get("lead"),phone:data.get("phone"),consent:data.has("consent")};
}
export default function MonthlyCash(){
  const [plans,setPlans]=useState<DisplayPlan[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [createId,setCreateId]=useState("");
  async function refresh(){const r=await fetch("/api/maintenance/cash",{cache:"no-store"});if(!r.ok)throw Error("Cash plans could not be loaded.");setPlans((await r.json()).plans);setReady(true)}
  useEffect(()=>{setCreateId(crypto.randomUUID());refresh().catch(e=>setNotice(e.message))},[]);
  async function write(body:Record<string,unknown>,message:string,after?:()=>void){
    setBusy(true);setNotice("");
    try{const r=await fetch("/api/maintenance/cash",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await r.json();if(!r.ok)throw Error(result.error||"Could not save.");after?.();await refresh();setNotice(result.message||message);
    }catch(e){setNotice(e instanceof Error?e.message:"Could not save cash plan.")}finally{setBusy(false)}
  }
  function create(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,data=new FormData(form);
    void write({action:"create",id:createId,customer:data.get("customer"),schedule:scheduleFrom(form),cents:Math.round(Number(data.get("amount"))*100)},"Cash plan created.",()=>{setCreateId(crypto.randomUUID());form.reset()})}
  return <section id="monthly-cash" className="my-6 rounded-2xl border border-black/15 bg-white p-5 text-[#171411]">
    <h2 className="text-2xl font-semibold">Monthly cash payments</h2><p className="mt-1 text-sm">Track monthly maintenance payments collected in person.</p>
    <details className="mt-4 rounded-xl border border-black/15 p-4"><summary className="cursor-pointer font-semibold">Add monthly cash plan</summary><form onSubmit={create} className="my-4 grid items-end gap-3 sm:grid-cols-2">
      <label>Customer name<input className={field} name="customer" required maxLength={120}/></label>
      <label>Monthly cash amount ($)<input className={field} name="amount" type="number" inputMode="decimal" min=".01" max="10000" step=".01" defaultValue="60" required/></label>
      <div className="sm:col-span-2"><ScheduleFields key={createId}/></div>
      <button className={button} disabled={busy||!ready}>Activate plan and text customer</button>
    </form></details><p className="mt-3" role="status">{notice}</p>{!ready&&notice&&<button onClick={()=>refresh().then(()=>setNotice("")).catch(e=>setNotice(e.message))}>Retry</button>}
    {ready&&!plans.length&&<p>No cash plans yet.</p>}
    {[...plans].sort((a,b)=>Number(a.ended)-Number(b.ended)||nextCashDue(a).localeCompare(nextCashDue(b))).map(plan=>{const due=nextCashDue(plan);return <article key={plan.id} className="mt-4 space-y-3 rounded-xl border border-black/15 p-4">
      <h3 className="font-bold">{plan.customer} · {usd(plan.cents)} / month</h3>
      {plan.schedule&&!plan.ended&&<p>{ordinals[plan.schedule.ordinal-1]} {weekdays[plan.schedule.weekday]} each month · Next detail <strong>{prettyDay(nextService(plan.schedule,chicagoDay()))}</strong><br/><small>{[plan.schedule.year,plan.schedule.make,plan.schedule.model].filter(Boolean).join(" ")} · {plan.schedule.phone} · Reminder {plan.schedule.lead} day{plan.schedule.lead===1?"":"s"} before · Activation SMS: {plan.activationStatus}</small></p>}
      <p>{plan.ended?"Plan ended":(due<chicagoDay()?"Overdue since ":due===chicagoDay()?"Due today · ": "Next cash payment ")+due}</p>
      {!plan.ended&&<details><summary className="cursor-pointer font-semibold">Record cash payment</summary><form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();void write({id:plan.id,action:"receive",month:due.slice(0,7),received:new FormData(e.currentTarget).get("received")},"Cash payment recorded.")}}>
        <label>Cash received date<input className={field} name="received" type="date" required defaultValue={chicagoDay()} max={chicagoDay()}/></label>
        <button className={button} disabled={busy}>Record {usd(plan.cents)} cash for {due.slice(0,7)}</button>
      </form></details>}
      <details><summary>Payment history ({plan.payments.length})</summary>{plan.payments.length?plan.payments.slice().reverse().map(p=><p key={p.month}>{p.month} · {usd(p.cents)} cash · Received {p.received}</p>):<p>No payments recorded.</p>}</details>
      {!plan.ended&&<details><summary>{plan.schedule?"Edit service schedule":"Set up recurring details and texts"}</summary><form onSubmit={e=>{e.preventDefault();void write({action:"schedule",id:plan.id,schedule:scheduleFrom(e.currentTarget)},"Schedule saved.")}}><ScheduleFields existing={plan.schedule}/><button className={button} disabled={busy}>Save schedule and notify customer</button></form></details>}
      {!plan.ended&&<details><summary>End plan</summary><button disabled={busy} onClick={()=>void write({id:plan.id,action:"end"},"Cash plan ended.")}>End monthly payments and keep history</button></details>}
    </article>})}</section>
}