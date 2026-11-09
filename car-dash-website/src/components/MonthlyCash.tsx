"use client";
import {useEffect,useState,type FormEvent} from "react";
import {chicagoDay,nextCashDue,type CashPlan} from "@/lib/cash-maintenance";
const usd=(n:number)=>(n/100).toLocaleString("en-US",{style:"currency",currency:"USD"});
const field="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-black/20 bg-white px-3 text-base text-black";
const button="rounded-xl bg-[#d6b779] px-4 py-3 font-semibold text-[#171411] disabled:opacity-50";
export default function MonthlyCash(){
  const [plans,setPlans]=useState<CashPlan[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [createId,setCreateId]=useState("");
  async function refresh(){const r=await fetch("/api/maintenance/cash",{cache:"no-store"});if(!r.ok)throw Error("Cash plans could not be loaded.");setPlans((await r.json()).plans);setReady(true)}
  useEffect(()=>{setCreateId(crypto.randomUUID());refresh().catch(e=>setNotice(e.message))},[]);
  async function write(body:Record<string,unknown>,message:string,after?:()=>void){
    setBusy(true);setNotice("");
    try{const r=await fetch("/api/maintenance/cash",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await r.json();if(!r.ok)throw Error(result.error||"Could not save.");after?.();await refresh();setNotice(message);
    }catch(e){setNotice(e instanceof Error?e.message:"Could not save cash plan.")}finally{setBusy(false)}
  }
  function create(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,data=new FormData(form);
    void write({action:"create",id:createId,customer:data.get("customer"),firstDue:data.get("firstDue"),cents:Math.round(Number(data.get("amount"))*100)},"Cash plan created.",()=>{setCreateId(crypto.randomUUID());form.reset()})}
  return <section id="monthly-cash" className="my-6 rounded-2xl border border-black/15 bg-white p-5 text-[#171411]">
    <h2 className="text-2xl font-semibold">Monthly cash payments</h2><p className="mt-1 text-sm">Track monthly maintenance payments collected in person.</p>
    <form onSubmit={create} className="my-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label>Customer name<input className={field} name="customer" required maxLength={120}/></label>
      <label>Monthly cash amount ($)<input className={field} name="amount" type="number" inputMode="decimal" min=".01" max="10000" step=".01" defaultValue="60" required/></label>
      <label>First payment due<input className={field} name="firstDue" type="date" defaultValue={chicagoDay()} required/></label>
      <button className={button} disabled={busy||!ready}>Create cash plan</button>
    </form><p role="status">{notice}</p>{!ready&&notice&&<button onClick={()=>refresh().then(()=>setNotice("")).catch(e=>setNotice(e.message))}>Retry</button>}
    {ready&&!plans.length&&<p>No cash plans yet.</p>}
    {plans.map(plan=>{const due=nextCashDue(plan);return <article key={plan.id} className="mt-4 space-y-3 border-t border-black/15 pt-4">
      <h3 className="font-bold">{plan.customer} · {usd(plan.cents)} / month</h3>
      <p>{plan.ended?"Plan ended":(due<chicagoDay()?"Overdue since ":due===chicagoDay()?"Due today · ":"Next due ")+due}</p>
      {!plan.ended&&<form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();void write({id:plan.id,action:"receive",month:due.slice(0,7),received:new FormData(e.currentTarget).get("received")},"Cash payment recorded.")}}>
        <label>Cash received date<input className={field} name="received" type="date" required defaultValue={chicagoDay()} max={chicagoDay()}/></label>
        <button className={button} disabled={busy}>Record {usd(plan.cents)} cash for {due.slice(0,7)}</button>
      </form>}
      <details><summary>Payment history ({plan.payments.length})</summary>{plan.payments.length?plan.payments.slice().reverse().map(p=><p key={p.month}>{p.month} · {usd(p.cents)} cash · Received {p.received}</p>):<p>No payments recorded.</p>}</details>
      {!plan.ended&&<details><summary>End plan</summary><button disabled={busy} onClick={()=>void write({id:plan.id,action:"end"},"Cash plan ended.")}>End monthly payments and keep history</button></details>}
    </article>})}</section>
}