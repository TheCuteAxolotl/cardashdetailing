"use client";
import {useEffect,useState} from "react";
type Overview={clocks:string[];active:number;handoffs:{id:string;service:string;count:number}[]};
export default function FieldOverview() {
  const [data,setData]=useState<Overview|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/jobs/overview",{signal:controller.signal,cache:"no-store"})
      .then(async r=>{if(!r.ok)throw Error();const view=await r.json();if(!controller.signal.aborted){setData(view);setError(false);}})
      .catch(()=>{if(!controller.signal.aborted)setError(true);});
    const refresh=()=>setRevision(v=>v+1);
    window.addEventListener("field-shift",refresh);
    return ()=>{controller.abort();window.removeEventListener("field-shift",refresh);};
  },[revision]);
  return <section aria-label="Field operations" className="space-y-2 bg-neutral-900 px-4 py-3 text-sm text-white">
    <div className="flex flex-wrap gap-4"><a className="font-semibold underline" href="/owner/jobs">Field operations</a>
    {data && <span>{data.active} in progress · Clocked in: {data.clocks.join(", ") || "Nobody"}</span>}
    <button className="underline" onClick={()=>setRevision(v=>v+1)}>Refresh</button></div>
    {error && <p role="alert">Field summary unavailable.</p>}
    {data?.handoffs.map(h=><a className="mr-4 inline-block underline" key={h.id} href={"/owner/jobs?job="+encodeURIComponent(h.id)}>{h.service} · {h.count} cash handoff{h.count===1?"":"s"} pending</a>)}
  </section>;
}
