"use client";
import { useEffect, useRef, useState } from "react";

type Booking = { customerName:string; vehicleYear:string; vehicleMake:string; vehicleModel:string; serviceName:string; preferredDate?:string|null };
const escapeText = (value:string) => value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));

export default function DetailReport({booking:b}:{booking:Booking}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const urls = useRef<string[]>([]);
  const [photos,setPhotos] = useState<Record<string,string>>({});
  const [work,setWork] = useState("");
  const [notes,setNotes] = useState("");
  const [error,setError] = useState("");
  useEffect(()=>()=>urls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
  async function preview() {
    const page = window.open("", "_blank");
    if (!page) {setError("Allow pop-ups to open the report.");return;}
    page.opener=null;
    const e=escapeText;
    page.document.write(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Car Dash Detailing Report</title><style>*{box-sizing:border-box}body{font:16px/1.5 Arial;color:#242321;max-width:830px;margin:auto;padding:5%}header{border-bottom:4px solid #b49250}header img{width:120px;background:#171717;padding:6px}h1{margin:12px 0}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;break-inside:avoid}figure img{width:100%;height:230px;object-fit:contain;background:#f4f3ef}figcaption,h2{font-size:15px;font-weight:bold}p,li{white-space:pre-wrap;overflow-wrap:anywhere}button{padding:12px;margin:12px 0}@media print{button{display:none}body{padding:0}@page{margin:16mm}}</style><header><img src="${location.origin}/car-dash-logo.png" alt="Car Dash Detailing"><h1>Detailing report</h1></header><p><strong>${e(b.customerName)}</strong><br>${e([b.vehicleYear,b.vehicleMake,b.vehicleModel].filter(Boolean).join(" "))}<br>${e(b.serviceName)} · ${e(b.preferredDate||"Date pending")}</p><section>${["Before","After"].filter(k=>photos[k]).map(k=>`<figure><figcaption>${k}</figcaption><img src="${e(photos[k])}" alt="${k} detailing"></figure>`).join("")}</section>${work.trim()?'<h2>Work completed</h2><ul>'+work.split('\n').filter(x=>x.trim()).map(x=>'<li>'+e(x)+'</li>').join("")+'</ul>':''}${notes.trim()?'<h2>Service notes</h2><p>'+e(notes)+'</p>':''}<footer>Car Dash Detailing · cardashdetailing.com</footer><button disabled>Print / Save PDF</button></html>`);
    page.document.close();
    try {await Promise.all(Array.from(page.document.images,img=>img.decode()));const btn=page.document.querySelector("button")!;btn.disabled=false;btn.onclick=()=>page.print();}
    catch {page.close();setError("A photo could not be opened. Try a JPEG or PNG.");}
  }
  return <><button type="button" className="rounded-lg border px-4 py-2" onClick={()=>dialog.current?.showModal()}>Detailing report</button>
    <dialog ref={dialog} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(92vw,32rem)] overflow-auto rounded-xl bg-[#211f1c] p-5 text-white backdrop:bg-black/70" aria-label="Detailing report">
    <h2 className="text-xl font-semibold">Detailing report</h2><p>{b.customerName} · {b.serviceName}</p>
    {["Before","After"].map(k=><label key={k} className="mt-4 block">{k} photo<input type="file" accept="image/*" className="block w-full" onChange={ev=>{const file=ev.target.files?.[0];const url=file?URL.createObjectURL(file):"";if(url)urls.current.push(url);setPhotos(old=>({...old,[k]:url}));setError("");}}/></label>)}
    <label className="mt-4 block">Work completed (one item per line)<textarea className="block w-full rounded border p-2" value={work} onChange={e=>setWork(e.target.value)}/></label>
    <label className="mt-4 block">Notes for customer<textarea className="block w-full rounded border p-2" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    {error&&<p role="alert">{error}</p>}<div className="mt-4 flex gap-4"><button type="button" onClick={preview} className="rounded bg-[#d6b779] px-3 py-2 text-black">Preview report</button><button type="button" onClick={()=>dialog.current?.close()}>Close</button></div></dialog></>;
}
