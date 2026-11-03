"use client";

import { useMemo, useState } from "react";
import OwnerAppIcon from "@/components/OwnerAppIcon";
import { phoneMatches, useOwnerScreenPrivacy } from "@/lib/owner-screen-privacy";
import type { EditableBooking } from "@/components/BookingDetailsEditor";

type Activity={id:string;kind:string;title:string;detail:string;href:string;time:string};

export default function OwnerPrivacyControls({bookings,activity}:{
  bookings:EditableBooking[];activity:Activity[];
}){
 const {recording,aliases,changeRecording,saveAlias}=useOwnerScreenPrivacy();
 const [editing,setEditing]=useState(false);
 const [phone,setPhone]=useState("");
 const [label,setLabel]=useState("");
 const [message,setMessage]=useState("");
 const unknown=useMemo(()=>{
   const phones=new Set<string>();
   for(const alert of activity)for(const candidate of phoneMatches(alert.title))phones.add(candidate);
   const known=new Set<string>(bookings.map(b=>(b.customerPhone||"").replace(/\D/g,"").slice(-10)).filter(n=>n.length===10));
   return [...phones].filter(n=>!known.has(n)).slice(0,12);
 },[activity,bookings]);
 const assign=(digits:string)=>{
   setPhone(digits);
   setLabel(aliases[digits]||"");
   setMessage("");
   setEditing(true);
 };
 const save=(event:React.FormEvent)=>{
   event.preventDefault();
   const result=saveAlias(phone,label);
   if(result){setMessage(result);return;}
   setMessage(label.trim()?"Display name saved on this device.":"Display name cleared.");
   setPhone("");setLabel("");
 };
 return <>
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.12] bg-[#1d1c1a] px-3.5 py-3">
   <div className="min-w-0">
    <p className="text-xs font-semibold text-[#f0e5d5]">{recording?"Recording mode is on":"Screen privacy"}</p>
    <p className="mt-1 text-[10px] leading-4 text-[#b3a99b]">{recording?"Customer names, phone numbers, addresses and message previews are hidden.":"Phone numbers in alerts are shown as saved names instead."}</p>
   </div>
   <div className="flex shrink-0 items-center gap-2">
    <button type="button" onClick={()=>{if(recording){setMessage("");setEditing(true);}else setEditing(true);}}
      className="rounded-lg border border-white/15 px-2.5 py-2 text-[11px] font-semibold text-[#e5cfaa]">
      Names
    </button>
    <button type="button" role="switch" aria-checked={recording} aria-label="Recording privacy mode"
      onClick={()=>changeRecording(!recording)}
      className={"relative h-7 w-12 rounded-full border transition "+(recording?"border-[#d6b779] bg-[#d6b779]":"border-white/25 bg-[#4d4740]")}>
      <span className={"absolute top-[3px] h-[18px] w-[18px] rounded-full bg-[#171612] transition-all "+(recording?"left-[25px]":"left-[3px]")}/>
    </button>
   </div>
  </div>
  {editing&&<div role="dialog" aria-modal="true" aria-labelledby="owner-alias-title"
    className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl">
    <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#211f1c] p-5 text-[#eee6d9] shadow-2xl">
      <div className="flex items-center justify-between gap-3">
       <div><p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#d6b779]">Private contact labels</p><h2 id="owner-alias-title" className="mt-1 text-xl font-semibold">Display names</h2></div>
       <button type="button" aria-label="Close display names" onClick={()=>{setEditing(false);setMessage("");}}
         className="grid h-10 w-10 place-items-center rounded-lg border border-white/20 text-[#f5e6d1]">×</button>
      </div>
      <p className="mt-3 text-xs leading-6 text-[#bdb2a3]">
        Assign a customer-friendly name to an incoming phone number. This changes how numbers appear in your owner home and notification previews. It does not change SMS recipients, customer records or past conversations.
      </p>
      {recording?<div className="mt-4 rounded-xl border border-[#a68757]/35 bg-[#352a1d] p-4">
        <p className="text-xs leading-5 text-[#f0d8b0]">Turn off Recording mode before editing labels, because this screen would otherwise show private phone numbers.</p>
        <button type="button" onClick={()=>changeRecording(false)} className="mt-3 rounded-lg border border-[#d6b779]/40 bg-[#d6b779]/15 px-4 py-2.5 text-xs font-semibold text-[#f2d9a9]">Turn off Recording mode</button>
      </div>:<>
        {unknown.length>0&&<div className="mt-4">
         <p className="text-xs font-semibold text-[#e0c997]">Recently unidentified numbers</p>
         <div className="mt-2 space-y-2">
           {unknown.map(digits=><button key={digits} type="button" onClick={()=>assign(digits)}
             className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-[#2a2926] px-3 py-2.5 text-left text-xs text-[#e6ded3]">
             <span>{aliases[digits]||"New customer"} <span className="ml-1 text-[#a99c8e]">••• {digits.slice(-4)}</span></span>
             <span className="font-semibold text-[#e5cd9b]">Rename</span>
           </button>)}
         </div>
        </div>}
        <form onSubmit={save} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold text-[#ded0bd]">Phone number
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(630) 555-0000"
              autoComplete="off" required
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#2a2927] px-4 py-3 text-base text-[#f7ead8] outline-none placeholder:text-[#958b7e] focus:border-[#d6b779]"/>
          </label>
          <label className="block text-xs font-semibold text-[#ded0bd]">Display name
            <input type="text" value={label} onChange={e=>setLabel(e.target.value)} maxLength={64}
              placeholder="Example: Returning customer" autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#2a2927] px-4 py-3 text-base text-[#f7ead8] outline-none placeholder:text-[#958b7e] focus:border-[#d6b779]"/>
          </label>
          <p className="text-[11px] leading-5 text-[#a99e90]">Leaving the name blank and saving clears a previous label.</p>
          <button type="submit" className="w-full rounded-xl bg-[#d6b779] px-4 py-3.5 text-sm font-bold text-[#181714]">Save display name</button>
        </form>
        {Object.keys(aliases).length>0&&<p className="mt-4 text-xs text-[#b6aa99]">{Object.keys(aliases).length} display name(s) saved on this device.</p>}
       </>}
       {message&&<p role="status" className="mt-3 rounded-lg border border-[#d6b779]/25 bg-[#332d22] p-3 text-xs text-[#e5cfaa]">{message}</p>}
       <p className="mt-4 text-[11px] leading-5 text-[#a49a8d]">Labels are saved in this browser only. Use Recording mode when filming customer information. Other owner pages may still show real information.</p>
    </div>
  </div>}
 </>;
}
