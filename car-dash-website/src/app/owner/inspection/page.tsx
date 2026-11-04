"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JOB_CHECKS, type JobData, type JobState } from "@/lib/job-workflow";
import { useOwnerScreenPrivacy } from "@/lib/owner-screen-privacy";
type Booking={id:string;customerName:string;serviceName:string;vehicleYear:string;vehicleMake:string;vehicleModel:string;preferredDate:string|null;preferredTime:string|null;status:string};
type Job={id:string;assigneeName:string;state:JobState;version:number;updatedAt:string;missingPhotos:string[];data:JobData};
type Photo={id:string;area:string;phase:string;createdAt:string;uploadedBy:string};
type Data={owner:boolean;jobs:Job[];bookings:Booking[]};
function time(value:string){return new Date(value).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Chicago"});}
function friendly(state:JobState){return ({assigned:"Assigned",in_progress:"In progress",awaiting_review:"Awaiting review",needs_touch_up:"Needs touch-up",approved:"Approved"} as Record<JobState,string>)[state];}
export default function InspectionPage(){
 const [data,setData]=useState<Data|null>(null);
 const [selected,setSelected]=useState("");
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [loading,setLoading]=useState(true);
 const [photoLoading,setPhotoLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [filter,setFilter]=useState("All");
 const {recording}=useOwnerScreenPrivacy();
 const load=useCallback(async()=>{
   setError("");
   try{
     const r=await fetch("/api/jobs",{cache:"no-store"});
     const json=await r.json();
     if(!r.ok)throw new Error(json.error||"Could not load jobs.");
     setData(json);
     setSelected(current=>json.jobs.some((j:Job)=>j.id===current)?current:json.jobs[0]?.id||"");
   }catch(e){setError(e instanceof Error?e.message:"Job inspection unavailable");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
   if(!selected){setPhotos([]);return;}
   let cancelled=false;
   setPhotoLoading(true);
   fetch("/api/jobs/"+encodeURIComponent(selected)+"/photos",{cache:"no-store"})
    .then(async r=>{const json=await r.json();if(!r.ok)throw Error(json.error||"Photos unavailable");return json;})
    .then(json=>{if(!cancelled)setPhotos(json.photos||[]);})
    .catch(e=>{if(!cancelled){setPhotos([]);setError(e.message);}})
    .finally(()=>{if(!cancelled)setPhotoLoading(false);});
   return()=>{cancelled=true;};
 },[selected]);
 const job=data?.jobs.find(j=>j.id===selected);
 const booking=data?.bookings.find(b=>b.id===selected);
 const after=photos.filter(p=>p.phase==="after");
 const approvedAt=job?.data.history?.filter(item=>item.action==="approve").at(-1);
 const allChecked=JOB_CHECKS.every(x=>job?.data.checks?.includes(x));
 const canApprove=Boolean(data?.owner&&job?.state==="awaiting_review"&&allChecked&&after.length>0&&!job?.missingPhotos?.length);
 async function review(action:"approve"|"return"){
   if(!job)return;
   if(action==="approve"&&!canApprove){setError("The job needs every required checklist item and photo before approval.");return;}
   if(action==="return"&&!feedback.trim()){setError("Explain what needs a touch-up before returning this job.");return;}
   setBusy(true);setError("");setNotice("");
   try{
     const r=await fetch("/api/jobs",{method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id:job.id,version:job.version,action,feedback})});
     const json=await r.json().catch(()=>({}));
     if(!r.ok)throw Error(json.error||"Could not update inspection.");
     setNotice(action==="approve"?"Final inspection approved and recorded.":"Job returned for touch-up with your notes.");
     setFeedback("");
     await load();
   }catch(e){setError(e instanceof Error?e.message:"Could not save review.");}
   finally{setBusy(false);}
 }
 const filtered=(data?.jobs||[]).filter(j=>filter==="All"||j.state===filter);
 const display=(label:string)=>recording?"Customer details hidden":label;
 return <main className="min-h-screen bg-[#131211] px-4 py-6 text-[#f3ebdf] sm:px-7 sm:py-10">
   <div className="mx-auto max-w-6xl space-y-5">
     <header className="flex flex-wrap items-end justify-between gap-3">
       <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Quality before handoff</p>
         <h1 className="mt-2 text-3xl font-semibold tracking-tight">Final inspection & handoff</h1>
         <p className="mt-2 text-xs leading-6 text-[#aba294]">Use the actual detailer checklist, completed photos and owner approval record.</p>
       </div>
       <Link href="/owner/jobs" className="rounded-xl border border-[#d6b779]/40 px-4 py-2.5 text-xs font-semibold text-[#e6cc95]">Manage jobs</Link>
     </header>
     {error&&<p role="alert" className="rounded-xl border border-red-300/25 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error} <button type="button" onClick={()=>void load()} className="ml-2 underline">Retry</button></p>}
     {notice&&<p role="status" className="rounded-xl border border-[#d6b779]/30 bg-[#29261e] px-4 py-3 text-sm text-[#e9d4a7]">{notice}</p>}
     <div className="grid items-start gap-4 lg:grid-cols-[minmax(230px,.65fr)_minmax(0,1.35fr)]">
       <section className="rounded-2xl border border-white/10 bg-[#211f1d] p-4">
         <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Jobs</h2>
           <select aria-label="Filter inspections" value={filter} onChange={e=>setFilter(e.target.value)}
             className="rounded-lg border border-white/20 bg-[#302c26] px-3 py-2 text-xs text-[#f0e4d3]">
             <option value="All">All</option><option value="awaiting_review">Awaiting review</option><option value="approved">Approved</option>
             <option value="needs_touch_up">Needs touch-up</option><option value="in_progress">In progress</option>
           </select>
         </div>
         <div className="mt-3 max-h-[55dvh] space-y-2 overflow-y-auto lg:max-h-[70dvh]">
          {loading?<p className="py-6 text-center text-xs text-[#b1a89a]">Loading jobs…</p>:
           !filtered.length?<p className="py-6 text-center text-xs text-[#b1a89a]">No jobs in this stage. Start or assign a job in Jobs & Quality.</p>:
           filtered.map(item=>{
             const b=data?.bookings.find(x=>x.id===item.id);
             return <button key={item.id} type="button" onClick={()=>setSelected(item.id)}
               className={"w-full rounded-xl border p-3 text-left "+(selected===item.id?"border-[#d6b779]/60 bg-[#3a3022]":"border-white/10 bg-[#2b2824]")}>
               <p className="truncate text-sm font-semibold">{display(b?.customerName||"Job")}</p>
               <p className="mt-1 truncate text-xs text-[#b7ac9e]">{display(b?.serviceName||"Detailing service")}</p>
               <span className="mt-2 inline-flex rounded-full border border-[#d6b779]/30 bg-[#d6b779]/10 px-2 py-1 text-[10px] font-semibold text-[#ead2a3]">{friendly(item.state)}</span>
             </button>;
           })}
         </div>
       </section>
       <section className="space-y-4">
         {!job?<div className="rounded-2xl border border-white/10 bg-[#211f1d] px-4 py-12 text-center text-sm text-[#b8ad9c]">Choose a job to inspect.</div>:<>
           <div className="rounded-2xl border border-white/10 bg-[#211f1d] p-4 sm:p-5">
             <h2 className="text-lg font-semibold">{display([booking?.vehicleYear,booking?.vehicleMake,booking?.vehicleModel].filter(Boolean).join(" ")||"Customer vehicle")} · {display(booking?.serviceName||"Detailing")}</h2>
             <p className="mt-2 text-xs leading-5 text-[#bcb1a3]">{display("Tech: "+job.assigneeName)} · Updated {time(job.updatedAt)}</p>
             <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
               <span className={"rounded-full border px-3 py-1.5 text-xs font-semibold "+(job.state==="approved"?"border-[#6b9776]/40 bg-[#294030] text-[#c1e5c6]":"border-[#d6b779]/30 bg-[#362d20] text-[#e7ca96]")}>{job.state==="approved"?"Pass · Owner approved":friendly(job.state)}</span>
               <span className="text-xs font-semibold text-[#d6b779]">{approvedAt?"Owner approval recorded · "+time(approvedAt.at):"Awaiting final owner approval"}</span>
             </div>
           </div>
           <div className="rounded-2xl border border-white/10 bg-[#211f1d] p-4 sm:p-5">
             <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Quality checklist</h2>
               <span className="text-base font-semibold text-[#e5c990]">{JOB_CHECKS.filter(c=>job.data.checks.includes(c)).length}/{JOB_CHECKS.length}</span>
             </div>
             <div className="mt-4 divide-y divide-white/10">{JOB_CHECKS.map(item=>{
                const checked=job.data.checks.includes(item);
                return <div key={item} className="flex items-center gap-3 py-3">
                  <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-bold "+(checked?"border-[#75a680]/45 bg-[#2c4933] text-[#b9e6c2]":"border-white/20 bg-[#35312c] text-[#baa995]")}>{checked?"✓":"–"}</span>
                  <span className="text-sm leading-6 text-[#e4d8c9]">{item}</span>
                </div>;
               })}</div>
             {job.state==="awaiting_review"&&<p className="mt-3 text-xs leading-5 text-[#ac9f90]">These were completed by the assigned detailer before submitting work for review.</p>}
           </div>
           <div className="rounded-2xl border border-white/10 bg-[#211f1d] p-4 sm:p-5">
             <div className="flex justify-between gap-2"><h2 className="text-lg font-semibold">After photos</h2>
               <span className="text-sm font-semibold text-[#d6b779]">{photoLoading?"…":after.length}</span>
             </div>
             {!job.missingPhotos.length?<p className="mt-2 text-xs text-[#bbd6bd]">All required before-and-after photo areas have evidence.</p>
               :<p className="mt-2 text-xs text-[#e4be8e]">Missing evidence: {job.missingPhotos.join(", ")}</p>}
             {recording?<div className="mt-3 rounded-xl border border-white/10 p-6 text-center text-sm text-[#b0a597]">Photos hidden while Recording mode is on.</div>
              :photoLoading?<p className="mt-3 text-sm text-[#ada293]">Loading after photos…</p>
              :after.length?<div className="mt-4 grid grid-cols-2 gap-2">
                {after.slice(0,12).map(photo=><a key={photo.id} target="_blank" rel="noopener noreferrer"
                  href={"/api/jobs/"+encodeURIComponent(job.id)+"/photos?photo="+encodeURIComponent(photo.id)}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#302b24]">
                  <img src={"/api/jobs/"+encodeURIComponent(job.id)+"/photos?photo="+encodeURIComponent(photo.id)}
                    alt={"After photo: "+photo.area} className="aspect-[4/3] w-full object-cover"/>
                  <span className="block truncate px-2 py-1.5 text-[10px] text-[#ded0bb]">{photo.area}</span>
                </a>)}</div>
              :<p className="mt-3 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-xs text-[#ad9f90]">No after photos yet. Upload them on the Jobs page.</p>}
           </div>
           {data?.owner&&job.state==="awaiting_review"&&!recording&&<div className="rounded-2xl border border-[#d6b779]/25 bg-[#272219] p-4 sm:p-5">
             <h2 className="text-lg font-semibold">Owner handoff review</h2>
             <p className="mt-2 text-xs leading-5 text-[#b9ac97]">Approval is recorded in the job audit trail. This is not a customer signature.</p>
             <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} rows={3} placeholder="Notes for touch-ups, if needed"
               className="mt-3 w-full rounded-xl border border-white/20 bg-[#1c1b19] p-3 text-base text-[#f2e6d8] outline-none focus:border-[#d6b779]"/>
             <div className="mt-3 grid grid-cols-2 gap-2">
               <button disabled={busy||!feedback.trim()} onClick={()=>void review("return")} className="rounded-xl border border-red-300/30 px-3 py-3 text-xs font-semibold text-red-200 disabled:opacity-40">Return for touch-up</button>
               <button disabled={busy||!canApprove} onClick={()=>void review("approve")} className="rounded-xl bg-[#d6b779] px-3 py-3 text-xs font-bold text-[#161511] disabled:opacity-40">{busy?"Saving…":"Approve & handoff"}</button>
             </div>
           </div>}
           <Link href="/owner/jobs" className="inline-flex rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-[#e2ca9f]">Open full job details & photos</Link>
         </>}
       </section>
     </div>
   </div>
 </main>;
}
