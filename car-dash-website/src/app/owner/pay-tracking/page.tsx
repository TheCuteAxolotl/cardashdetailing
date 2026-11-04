"use client";
import { useEffect,useMemo,useState } from "react";
import Link from "next/link";
type PayEntry={id:string;name:string;periodStart:string;periodEnd:string;hourlyRate:number;regularHours:number;overtimeHours:number;commission:number;adjustments:number;notes:string;reviewed:boolean};
const input="mt-1.5 w-full rounded-xl border border-white/15 bg-[#292723] px-3.5 py-3 text-base text-[#f3e9db] outline-none focus:border-[#d6b779]";
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
function today(){const parts=new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"America/Chicago"}).formatToParts(new Date());const p=(s:string)=>parts.find(x=>x.type===s)?.value||"";return p("year")+"-"+p("month")+"-"+p("day");}
function fresh():PayEntry{return {id:"pay_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),name:"",periodStart:today(),periodEnd:today(),hourlyRate:0,regularHours:0,overtimeHours:0,commission:0,adjustments:0,notes:"",reviewed:false};}
function gross(e:PayEntry){return Math.round((e.regularHours*e.hourlyRate+e.overtimeHours*e.hourlyRate*1.5+e.commission+e.adjustments)*100)/100;}
export default function OwnerPayTracking(){
 const [entries,setEntries]=useState<PayEntry[]>([]);
 const [version,setVersion]=useState<string|null>(null);
 const [draft,setDraft]=useState<PayEntry|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [period,setPeriod]=useState("All");
 const periods=useMemo(()=>["All",...Array.from(new Set(entries.map(e=>e.periodStart+" to "+e.periodEnd))).sort().reverse()],[entries]);
 const filtered=entries.filter(e=>period==="All"||e.periodStart+" to "+e.periodEnd===period);
 const total=filtered.reduce((s,e)=>s+gross(e),0);
 const regular=filtered.reduce((s,e)=>s+e.regularHours,0);
 const overtime=filtered.reduce((s,e)=>s+e.overtimeHours,0);
 const commissions=filtered.reduce((s,e)=>s+e.commission,0);
 async function load(){
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/owner/pay-tracking",{cache:"no-store"});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(data.error||"Pay worksheet unavailable");
   setEntries(Array.isArray(data.entries)?data.entries:[]);setVersion(data.version||null);setDirty(false);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load pay tracking.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 const updateDraft=(key:keyof PayEntry,value:string|number|boolean)=>{
   setDraft(prev=>prev?({...prev,[key]:value,reviewed:false}):prev);
 };
 function stage(e:React.FormEvent){
   e.preventDefault();if(!draft)return;
   if(!draft.name.trim()||draft.periodStart>draft.periodEnd){setError("Enter a name and valid pay period.");return;}
   if([draft.regularHours,draft.overtimeHours,draft.hourlyRate,draft.commission].some(x=>!Number.isFinite(x)||x<0)){setError("Hours, wages, and commissions cannot be negative.");return;}
   if(gross(draft)<0){setError("Estimated gross pay cannot be negative.");return;}
   setEntries(prev=>prev.some(x=>x.id===draft.id)?prev.map(x=>x.id===draft.id?draft:x):[...prev,draft]);
   setDraft(null);setDirty(true);setMessage("Changes staged. Save the worksheet to store them.");setError("");
 }
 function markReviewed(id:string){
   setEntries(prev=>prev.map(x=>x.id===id?{...x,reviewed:!x.reviewed}:x));
   setDirty(true);setMessage("Review status staged. Save to keep it.");
 }
 async function save(){
   setSaving(true);setError("");setMessage("");
   try{
     const r=await fetch("/api/owner/pay-tracking",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({entries,version})});
     const json=await r.json().catch(()=>({}));
     if(!r.ok)throw Error(json.error||"Could not save worksheet.");
     setVersion(json.version||null);setDirty(false);setMessage("Pay worksheet saved.");
   }catch(e){setError(e instanceof Error?e.message:"Could not save worksheet.");}
   finally{setSaving(false);}
 }
 return <main className="min-h-screen bg-[#131211] px-4 py-6 pb-28 text-[#f2e9dc] sm:px-7 sm:py-10">
  <div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Team operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pay tracking</h1>
        <p className="mt-2 text-xs leading-6 text-[#a99e91]">Owner-only gross-pay estimates based on hours and commission you enter.</p>
      </div>
      <button type="button" onClick={()=>setDraft(fresh())} className="rounded-xl bg-[#d6b779] px-4 py-3 text-xs font-bold text-[#181714]">Add pay entry</button>
    </header>
    <label className="block text-xs font-semibold text-[#c6b8a4]">Pay period
      <select className={input+" max-w-sm"} value={period} onChange={e=>setPeriod(e.target.value)}>
       {periods.map(p=><option key={p} value={p}>{p==="All"?"All pay periods":p}</option>)}
      </select>
    </label>
    <section className="rounded-2xl border border-white/10 bg-[#221f1b] p-5">
      <p className="text-sm text-[#baa995]">Estimated gross pay</p>
      <p className="mt-2 text-4xl font-semibold tracking-[-.05em] tabular-nums">{loading?"—":money(total)}</p>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        <div><p className="text-xl font-semibold tabular-nums">{regular.toFixed(1)}</p><p className="mt-1 text-[11px] text-[#a99c8a]">Regular hours</p></div>
        <div><p className="text-xl font-semibold tabular-nums">{overtime.toFixed(1)}</p><p className="mt-1 text-[11px] text-[#a99c8a]">OT hours</p></div>
        <div><p className="text-xl font-semibold tabular-nums">{money(commissions)}</p><p className="mt-1 text-[11px] text-[#a99c8a]">Commission</p></div>
      </div>
    </section>
    {error&&<p role="alert" className="rounded-xl border border-red-300/30 bg-red-900/20 p-4 text-sm text-red-200">{error}</p>}
    {message&&<p role="status" className="rounded-xl border border-[#d6b779]/25 bg-[#30291e] p-4 text-sm text-[#e2ceac]">{message}</p>}
    <section className="space-y-3">
      {loading?<p className="py-8 text-center text-sm text-[#afa598]">Loading pay worksheet…</p>:
       filtered.length?filtered.map(entry=><article key={entry.id} className="rounded-2xl border border-white/10 bg-[#211f1d] p-4 sm:p-5">
         <div className="flex flex-wrap items-start justify-between gap-3">
           <div className="min-w-0"><p className="text-lg font-semibold">{entry.name}</p>
             <p className="mt-1 text-xs text-[#b0a594]">{entry.periodStart} – {entry.periodEnd} · {money(entry.hourlyRate)}/hour</p></div>
           <p className="text-xl font-semibold tabular-nums text-[#e5c991]">{money(gross(entry))}</p>
         </div>
         <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
           <div><p className="text-sm font-semibold">{entry.regularHours} h</p><p className="text-[11px] text-[#a99f90]">Regular</p></div>
           <div><p className="text-sm font-semibold">{entry.overtimeHours} h</p><p className="text-[11px] text-[#a99f90]">Overtime</p></div>
           <div><p className="text-sm font-semibold">{money(entry.commission)}</p><p className="text-[11px] text-[#a99f90]">Commission</p></div>
         </div>
         <div className="mt-4 flex flex-wrap gap-2">
           <button type="button" onClick={()=>setDraft({...entry})} className="rounded-lg border border-white/20 px-3 py-2.5 text-xs font-semibold">Edit</button>
           <button type="button" onClick={()=>markReviewed(entry.id)} className={"rounded-lg border px-3 py-2.5 text-xs font-semibold "+(entry.reviewed?"border-[#76a080]/35 bg-[#2b4031] text-[#c3e0c9]":"border-[#d6b779]/30 text-[#dfc591]")}>{entry.reviewed?"Reviewed · mark open":"Mark reviewed"}</button>
           <button type="button" onClick={()=>{if(confirm("Remove this pay worksheet row?")){setEntries(prev=>prev.filter(x=>x.id!==entry.id));setDirty(true);}}} className="rounded-lg border border-red-300/20 px-3 py-2.5 text-xs text-red-200">Remove</button>
         </div>
       </article>):<div className="rounded-2xl border border-dashed border-white/15 bg-[#211f1d] px-4 py-9 text-center">
         <p className="text-sm font-semibold">No pay entries recorded</p>
         <p className="mt-2 text-xs text-[#a99f90]">Add hours, rates and commissions to see a breakdown here.</p>
       </div>}
    </section>
    <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6b779]/25 bg-[#1f1b17]/95 p-3.5 shadow-xl backdrop-blur-lg">
      <p className="text-xs text-[#cbbb9d]">{dirty?"Unsaved worksheet changes":"Worksheet saved locally in Car Dash's owner database"}</p>
      <button type="button" onClick={()=>void save()} disabled={!dirty||saving} className="rounded-xl bg-[#d6b779] px-5 py-3 text-xs font-bold text-[#161513] disabled:opacity-40">{saving?"Saving…":"Save worksheet"}</button>
    </div>
    <div className="rounded-xl border border-[#d6b779]/20 bg-[#28241c] p-4 text-xs leading-6 text-[#bbae98]">
      This is a manual planning worksheet, not approved payroll or a payment system. Overtime is estimated at 1.5× the entered hourly rate, plus any entered commission and adjustments. It does not calculate taxes, deductions, required minimum wages or legal overtime eligibility. Mark reviewed does not send money or file payroll.
      <Link href="/owner/admins" className="mt-2 block font-semibold text-[#e5c993]">Manage team access</Link>
    </div>
  </div>
  {draft&&<div role="dialog" aria-modal="true" aria-label="Pay worksheet entry" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-lg">
    <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#201e1b] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Staff pay entry</h2><button type="button" onClick={()=>setDraft(null)} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Close</button></div>
      <form onSubmit={stage} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[#d0c3b1] sm:col-span-2">Employee name
          <input required maxLength={120} value={draft.name} onChange={e=>updateDraft("name",e.target.value)} className={input} placeholder="Employee's full name"/>
        </label>
        {(["periodStart","periodEnd"] as const).map(key=><label key={key} className="text-xs text-[#d0c3b1]">{key==="periodStart"?"Period start":"Period end"}
          <input type="date" required value={draft[key]} onChange={e=>updateDraft(key,e.target.value)} className={input}/>
        </label>)}
        {([
          ["hourlyRate","Hourly rate"],["regularHours","Regular hours"],["overtimeHours","Overtime hours"],
          ["commission","Commission ($)"],["adjustments","Other gross adjustments ($)"],
        ] as const).map(([key,label])=><label key={key} className="text-xs text-[#d0c3b1]">{label}
          <input type="number" step=".01" min={key==="adjustments"?undefined:"0"} required value={draft[key]}
            onChange={e=>updateDraft(key,Number(e.target.value))} className={input}/>
        </label>)}
        <label className="text-xs text-[#d0c3b1] sm:col-span-2">Notes
          <textarea rows={2} maxLength={600} value={draft.notes} onChange={e=>updateDraft("notes",e.target.value)} className={input}/>
        </label>
        <div className="rounded-lg border border-[#d6b779]/20 bg-[#302a20] p-4 sm:col-span-2">
          <p className="text-xs text-[#baa98e]">Calculated gross estimate</p><p className="mt-2 text-2xl font-semibold text-[#f2d9a7]">{money(gross(draft))}</p>
        </div>
        <button type="submit" className="rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-bold text-[#171614] sm:col-span-2">Apply entry</button>
      </form>
    </div>
  </div>}
 </main>;
}
