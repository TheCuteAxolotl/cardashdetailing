"use client";
import {useState,useEffect,useCallback,useRef} from "react";
type Receipt={id:string;shown:number;received:number;balance:number;method:string;reference:string;collector:string;collectorId:string;handoff:{by:string;counted:number;variance:number}|null};
type View={balance:number|null;supervisor:boolean;rows:Receipt[]};
const money=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD"});
export default function JobCollections({id,version,userId}:{id:string;version:number;userId:string}) {
  const [view,setView]=useState<View|null>(null), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  const pending=useRef(""),lock=useRef(false);
  const url="/api/jobs/"+encodeURIComponent(id)+"/collections";
  const load=useCallback(async()=>{
    const response=await fetch(url,{cache:"no-store"}); const data=await response.json();
    if (!response.ok) throw Error(data.error); setView(data);
  },[url]);
  useEffect(()=>{load().catch(e=>setError(e.message));},[load,version]);
  async function submit(body:Record<string,unknown>, form:HTMLFormElement) {
    if(lock.current)return; lock.current=true;setBusy(true);setError("");
    try {
      const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,version})});
      const data=await res.json(); if(!res.ok)throw Error(data.error);
      await load(); pending.current="";form.reset();
    }catch(e){setError(e instanceof Error?e.message:"Could not save payment.");}
    finally{lock.current=false;setBusy(false);}
  }
  return <section className="space-y-3 rounded-xl border border-white/15 p-4"><h3 className="font-semibold">Payment & cash handoff</h3>
    {error && <p role="alert">{error} <button onClick={()=>load().then(()=>setError("")).catch(e=>setError(e.message))}>Refresh</button></p>}
    {view && <><p>{view.balance==null?"Price unavailable": "Balance due "+money(view.balance)}</p>
    {view.balance!=null && view.balance>0 && <form className="flex flex-wrap items-center gap-3" onSubmit={e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);pending.current ||= crypto.randomUUID();
      void submit({action:"collect",requestId:pending.current,shown:view.balance,amount:Number(f.get("amount")),method:f.get("method"),reference:f.get("reference")},form);}}>
      <label>Amount received <input className="w-24 rounded bg-neutral-800 p-2" name="amount" required type="number" min=".01" step=".01" max={view.balance}/></label>
      <select aria-label="Payment method" className="rounded bg-neutral-800 p-2" name="method">{["Cash","Card (outside website)","Check","Zelle","Venmo","Other"].map(m=><option key={m}>{m}</option>)}</select>
      <input aria-label="Transaction reference" name="reference" maxLength={120} placeholder="Transaction reference" className="rounded bg-neutral-800 p-2"/>
      <button disabled={busy} className="rounded bg-amber-200 p-2 text-black">Record payment received</button></form>}
    {view.rows.map(r=><article key={r.id} className="border-t border-white/15 pt-2"><p>{r.collector} · {r.method} · {money(r.received)} received</p>
      <p>Shown {money(r.shown)} · Balance {money(r.balance)} {r.reference && " · "+r.reference}</p>
      {r.method==="Cash" && (r.handoff ? <p>Received by {r.handoff.by} · Counted {money(r.handoff.counted)} · Difference {money(r.handoff.variance)}</p> :
      view.supervisor && r.collectorId!==userId ? <form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;void submit({action:"handoff",requestId:r.id,counted:Number(new FormData(form).get("counted"))},form);}}>
      <label>Counted cash <input className="w-24 bg-neutral-800 p-2" required name="counted" type="number" min="0" step=".01"/></label> <button disabled={busy}>Confirm handoff</button></form> : <p>Awaiting supervisor handoff</p>)}</article>)}</>}
  </section>;
}
