"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Alert = {id:string;kind:"booking"|"quote"|"message"|"call"|"support";title:string;detail:string;href:string;time:string};
type Payload = {alerts:Alert[];unread:number;seenAt:string|null};
const age = (value:string) => {
  const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(value))/60000));
  return minutes<1?"Just now":minutes<60?minutes+"m ago":minutes<1440?Math.floor(minutes/60)+"h ago":new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const icon:{[K in Alert["kind"]]:string}={booking:"▦",quote:"✦",message:"✉",call:"☎",support:"?"};

export default function OwnerActivityBell() {
  const [payload,setPayload]=useState<Payload|null>(null);
  const [open,setOpen]=useState(false);
  const [enabled,setEnabled]=useState(false);
  const [message,setMessage]=useState("");
  const [toast,setToast]=useState<Alert|null>(null);
  const ready=useRef(false);
  const last=useRef(new Set<string>());
  const wrapper=useRef<HTMLDivElement>(null);

  const load=useCallback(async()=>{
    try {
      const response=await fetch("/api/owner/activity",{cache:"no-store"});
      if(!response.ok)return;
      const next:Payload=await response.json();
      const newOnes=ready.current?next.alerts.filter(item=>!last.current.has(item.id)):[];
      last.current=new Set(next.alerts.map(item=>item.id));
      ready.current=true;
      setPayload(next);
      if(newOnes.length&&localStorage.getItem("cardash_live_alerts")==="yes") {
        const latest=newOnes[0];
        setToast(latest);
        if(document.hidden) {
          try {
            if("Notification" in window&&Notification.permission==="granted"&&"serviceWorker" in navigator) {
              const reg=await navigator.serviceWorker.getRegistration("/"); 
              if(reg) await reg.showNotification(latest.title,{
                body:latest.detail.slice(0,90),icon:"/favicon.png",tag:latest.id,
                data:{url:latest.href},
              });
            }
          }catch { /* in-app notification remains available */ }
        }
      }
    }catch { /* Network errors do not break navigation. */ }
  },[]);
  useEffect(()=>{
    setEnabled(localStorage.getItem("cardash_live_alerts")==="yes");
    void load();
    const timer=window.setInterval(()=>void load(),30000);
    const onFocus=()=>void load();
    window.addEventListener("focus",onFocus);
    return()=>{clearInterval(timer);window.removeEventListener("focus",onFocus)};
  },[load]);
  useEffect(()=>{
    if(!open)return;
    const dismiss=(event:PointerEvent)=>{if(wrapper.current&&!wrapper.current.contains(event.target as Node))setOpen(false)};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
    document.addEventListener("pointerdown",dismiss);
    document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape)};
  },[open]);

  const setLive=async()=>{
    if(enabled) {
      localStorage.removeItem("cardash_live_alerts");
      setEnabled(false);
      setMessage("Live alerts paused on this device. Inbox history is unchanged.");
      return;
    }
    localStorage.setItem("cardash_live_alerts","yes");
    setEnabled(true);
    setMessage("Live in-app alerts enabled. They'll update while the dashboard is open.");
    if(!("Notification" in window)||!("serviceWorker" in navigator))return;
    try {
      const reg=await navigator.serviceWorker.register("/car-dash-alert-sw.js",{scope:"/"});
      if(Notification.permission==="default") {
        const permission=await Notification.requestPermission();
        if(permission!=="granted")setMessage("In-app alerts enabled. Your browser did not allow system notifications.");
      }else if(Notification.permission==="denied") {
        setMessage("In-app alerts enabled. System notifications are blocked in device settings.");
      }else if(!reg.active) {
        await navigator.serviceWorker.ready;
      }
    }catch {setMessage("In-app alerts enabled. System notifications aren't available on this browser.");}
  };
  const markRead=async()=>{
    const response=await fetch("/api/owner/activity",{method:"POST"});
    if(response.ok)await load();
  };
  return <div ref={wrapper} className="relative">
    <button type="button" onClick={()=>{setOpen(v=>!v);setMessage("");}}
      aria-label={"Notifications"+(payload?.unread?" ("+payload.unread+" new)":"")} aria-expanded={open}
      className="owner-notification-trigger relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#22211f] text-[#f4efe5] transition hover:border-[#d6b779]/60">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      {Boolean(payload?.unread) && <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ec742f] px-1 text-[10px] font-bold text-[#101010]">{Math.min(99,payload?.unread||0)}{(payload?.unread||0)>99?"+":""}</span>}
    </button>
    {open && <div className="owner-activity-panel absolute right-0 top-[calc(100%+12px)] z-[110] w-[min(370px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/20 bg-[#1a1a19] text-[#f4efe5] shadow-[0_28px_100px_#0009]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6b779]">Live activity</p><h2 className="mt-1 text-lg font-semibold">Notifications</h2></div>
        <button type="button" onClick={()=>void markRead()} disabled={!payload?.unread} className="text-xs font-semibold text-[#e5c995] disabled:opacity-40">Mark read</button>
      </div>
      <div className="max-h-[min(57vh,480px)] overflow-y-auto divide-y divide-white/10">
        {payload?.alerts.length ? payload.alerts.map(alert=><a key={alert.id} href={alert.href} className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[.055]">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e58b4b]/15 text-lg text-[#e8a36a]">{icon[alert.kind]}</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{alert.title}</span><span className="mt-1 block line-clamp-2 break-words text-xs leading-5 text-[#bdb8b0]">{alert.detail}</span></span>
          <time className="shrink-0 text-[10px] text-[#969089]">{age(alert.time)}</time>
        </a>) : <p className="px-5 py-10 text-center text-sm text-[#bdb8b0]">No recent activity yet.</p>}
      </div>
      <div className="border-t border-white/10 bg-[#20201f] px-4 py-3">
        <button type="button" onClick={()=>void setLive()} className="flex w-full items-center justify-between gap-3 text-left text-xs font-medium text-[#e2dcd2]">
          <span>{enabled?"Live alerts enabled on this device":"Enable live alerts on this device"}</span>
          <span className={"relative inline-flex h-6 w-11 shrink-0 rounded-full transition "+(enabled?"bg-[#e58b4b]":"bg-[#55514b]")}><span className={"absolute top-1 h-4 w-4 rounded-full bg-[#171411] transition "+(enabled?"left-6":"left-1")}/></span>
        </button>
        <p className="mt-2 text-[11px] leading-5 text-[#aaa49a]">{message||"Notifications update while Car Dash is open. Lock-screen alerts when the app is closed require a separate Web Push setup."}</p>
      </div>
    </div>}
    {toast && <div className="fixed bottom-5 right-4 z-[120] w-[min(340px,calc(100vw-32px))] rounded-2xl border border-[#d6b779]/35 bg-[#25221d] px-4 py-4 text-[#f4efe5] shadow-[0_20px_80px_#000a]" role="status">
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e5c995]">New activity</p><button onClick={()=>setToast(null)} aria-label="Dismiss notification" className="text-lg leading-none text-[#cbc3b5]">×</button></div>
      <a href={toast.href} className="mt-2 block text-sm font-semibold">{toast.title}<span className="mt-1 block text-xs font-normal text-[#bdb8b0]">{toast.detail.slice(0,110)}</span></a>
    </div>}
  </div>;
}
