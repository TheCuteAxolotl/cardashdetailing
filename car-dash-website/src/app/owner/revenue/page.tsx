"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
type Row={service:string;received:number;invoices:number;share:number};
type Snapshot={month:string;total:number;paymentCount:number;invoiceCount:number;categories:Row[]};
type Response={current:Snapshot;previous:number;source:string};
function localMonth(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit"}).formatToParts(new Date());
 return (parts.find(p=>p.type==="year")?.value||"")+"-"+(parts.find(p=>p.type==="month")?.value||"");
}
function shift(month:string,n:number){
 const [y,m]=month.split("-").map(Number);
 return new Date(Date.UTC(y,m-1+n,1)).toISOString().slice(0,7);
}
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const monthName=(s:string)=>new Date(s+"-01T12:00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"});
export default function RevenuePage(){
 const [month,setMonth]=useState(localMonth);
 const [report,setReport]=useState<Response|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
   setLoading(true);setError("");
   try{
     const r=await fetch("/api/owner/revenue?month="+month,{cache:"no-store"});
     const data=await r.json();
     if(!r.ok)throw new Error(data.error||"Report unavailable");
     setReport(data);
   }catch(e){setReport(null);setError(e instanceof Error?e.message:"Report unavailable");}
   finally{setLoading(false);}
 },[month]);
 useEffect(()=>{void load();},[load]);
 const current=report?.current;
 const growth=report&&report.previous>0?((report.current.total-report.previous)/report.previous)*100:null;
 return <main className="min-h-screen bg-[#131211] px-4 py-6 text-[#f3eadc] sm:px-7 sm:py-10">
   <div className="mx-auto max-w-5xl space-y-5">
     <header className="flex flex-wrap items-end justify-between gap-4">
       <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Business performance</p>
         <h1 className="mt-2 text-3xl font-semibold tracking-tight">Revenue</h1>
         <p className="mt-2 text-xs leading-5 text-[#ada295]">Actual recorded invoice payments, grouped by service.</p>
       </div>
       <Link href="/owner/analytics" className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold">Analytics overview</Link>
     </header>
     <section className="rounded-[22px] border border-white/10 bg-[#201f1d] p-5 sm:p-7">
       <div className="flex flex-wrap items-center justify-between gap-3">
         <p className="text-sm text-[#bfb3a6]">{monthName(month)}</p>
         <div className="flex items-center gap-1.5">
           <button type="button" onClick={()=>setMonth(m=>shift(m,-1))} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-[#e2c895]">‹</button>
           <button type="button" onClick={()=>setMonth(localMonth())} className="rounded-lg border border-white/15 px-3 py-2 text-[11px]">This month</button>
           <button type="button" onClick={()=>setMonth(m=>shift(m,1))} disabled={month>=localMonth()} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-[#e2c895] disabled:opacity-35">›</button>
         </div>
       </div>
       <p className="mt-4 text-[34px] font-semibold tracking-[-.05em] tabular-nums sm:text-5xl">{loading?"—":money(current?.total||0)}</p>
       {growth!==null&&<p className={"mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold "+(growth>=0?"border-[#6f9c7e]/35 bg-[#293f31] text-[#bce3c5]":"border-[#ae8568]/35 bg-[#443024] text-[#f1c7ac]")}>
          {growth>=0?"+":""}{growth.toFixed(1)}% vs previous month
        </p>}
       <p className="mt-4 text-sm text-[#aea293]">{current?.invoiceCount??0} paid invoices · {current?.paymentCount??0} recorded payments</p>
     </section>
     {error&&<p role="alert" className="rounded-xl border border-red-300/30 bg-red-950/30 p-4 text-sm text-red-200">{error} <button type="button" onClick={()=>void load()} className="ml-2 font-semibold underline">Retry</button></p>}
     <section className="rounded-[22px] border border-white/10 bg-[#201f1d] p-5 sm:p-7">
       <h2 className="text-xl font-semibold">Revenue by service</h2>
       <p className="mt-2 text-xs leading-5 text-[#afa599]">Payments are allocated proportionally between line items on each invoice.</p>
       {loading?<p className="py-10 text-center text-sm text-[#afa599]">Loading revenue records…</p>
        :current?.categories.length?<div className="mt-6 space-y-7">
          {current.categories.map(row=><div key={row.service}>
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm font-semibold text-[#efe6d8]">{row.service}</p>
              <p className="text-base font-semibold tabular-nums text-[#ead29c]">{money(row.received)}</p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#393630]">
              <div style={{width:Math.min(100,row.share)+"%"}} className="h-full rounded-full bg-[#d6b779]"/>
            </div>
            <p className="mt-2 text-xs text-[#aaa092]">{row.invoices} invoices · {row.share.toFixed(1)}% of recorded receipts</p>
          </div>)}
         </div>:<div className="mt-7 rounded-xl border border-dashed border-white/15 px-5 py-9 text-center">
           <p className="text-sm font-semibold">No recorded payments this month</p>
           <p className="mt-2 text-xs leading-6 text-[#aba093]">Completed jobs and quotes do not automatically count as paid revenue. Record customer payments on their invoices to populate this report.</p>
           <Link href="/owner/invoices" className="mt-4 inline-flex rounded-lg bg-[#d6b779] px-4 py-2.5 text-xs font-bold text-[#181715]">Open invoices</Link>
         </div>}
     </section>
     <section className="rounded-xl border border-[#d6b779]/20 bg-[#28241e] p-4 text-xs leading-6 text-[#cfc1a9]">
       This is a cash-receipts view of invoices stored in Car Dash—not bank deposits, gross profit, or an accounting statement. A split-payment invoice contributes only its payments recorded in this month. Category allocation includes proportional discounts and taxes; some miscellaneous items appear as Other.
     </section>
   </div>
 </main>;
}
