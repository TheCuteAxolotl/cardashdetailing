"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerAppIcon from "@/components/OwnerAppIcon";
type Item={id:string;name:string;category:string;quantity:number;unit:string;reorderAt:number;unitCost:number;notes:string;onOrder:number;eta:string};
const CATEGORIES=["Chemicals","Equipment","Towels & pads","Consumables","Other"];
const UNITS=["each","bottles","liters","gallons","packs","pads","towels","ounces"];
const INPUT="mt-1.5 w-full rounded-xl border border-white/15 bg-[#282723] px-3.5 py-3 text-base text-[#f2ebdf] outline-none placeholder:text-[#948b7e] focus:border-[#d6b779]";
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
function fresh():Item{
 return {id:"item-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),
 name:"",category:"Chemicals",quantity:0,unit:"bottles",reorderAt:1,unitCost:0,notes:"",onOrder:0,eta:""};
}
export default function OwnerInventory(){
 const [items,setItems]=useState<Item[]>([]);
 const [scope,setScope]=useState("owner");
 const [scopes,setScopes]=useState<Array<{id:string;label:string}>>([{id:"owner",label:"My supplies (Owner)"}]);
 const [isOwner,setIsOwner]=useState(false);
 const [version,setVersion]=useState<string|null>(null);
 const [draft,setDraft]=useState<Item|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("All");
 const [lowOnly,setLowOnly]=useState(false);
 async function reload(){
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/owner/inventory?scope="+encodeURIComponent(scope),{cache:"no-store"});
   if(!response.ok)throw Error("Could not read inventory.");
   const result=await response.json();
   setItems(Array.isArray(result.items)?result.items:[]);
   setVersion(result.version||null);setDirty(false);
  }catch(e){setError(e instanceof Error?e.message:"Inventory unavailable.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void reload();},[scope]);
 useEffect(()=>{
  let live=true;
  fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json())
   .then(async auth=>{
    if(!live||auth?.user?.role!=="owner")return;
    setIsOwner(true);
    const r=await fetch("/api/owner/accounts",{cache:"no-store"});
    if(!r.ok)return;
    const data=await r.json();
    if(live)setScopes([
     {id:"owner",label:"My supplies (Owner)"},
     ...(Array.isArray(data.accounts)?data.accounts:[])
      .filter((user:{id:string;name:string;role:string;effectivePermissions:string[]})=>
        user.role!=="owner" && user.effectivePermissions?.includes("assignedJobs"))
      .map((user:{id:string;name:string})=>({id:"staff:"+user.id,label:user.name+" · Detailer"})),
    ]);
   }).catch(()=>{});
  return ()=>{live=false;};
 },[]);
 const low=items.filter(x=>x.quantity<=x.reorderAt);
 const onOrder=items.filter(x=>(x.onOrder||0)>0);
 const inStock=items.filter(x=>x.quantity>x.reorderAt);
 const filtered=useMemo(()=>items.filter(x=>
  (category==="All"||x.category===category)&&
  (!lowOnly||x.quantity<=x.reorderAt)&&
  (!search.trim()||(x.name+" "+x.category+" "+x.notes).toLowerCase().includes(search.trim().toLowerCase()))
 ).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name)),[items,category,lowOnly,search]);
 const stockValue=items.reduce((sum,x)=>sum+x.quantity*x.unitCost,0);
 const edit=(v:Item)=>{setDraft({...v});setMessage("");};
 const commitDraft=()=>{
  if(!draft)return;
  if(!draft.name.trim()){setError("Enter a supply name.");return;}
  if([draft.quantity,draft.reorderAt,draft.unitCost,draft.onOrder||0].some(n=>!Number.isFinite(n)||n<0)){setError("Quantities and costs must be zero or greater.");return;}
  setItems(current=>current.some(x=>x.id===draft.id)?current.map(x=>x.id===draft.id?{...draft,name:draft.name.trim()}:x):[...current,{...draft,name:draft.name.trim()}]);
  setDraft(null);setDirty(true);setError("");setMessage("Change staged. Save inventory to store it.");
 };
 const remove=(id:string)=>{
  if(!confirm("Remove this inventory item?"))return;
  setItems(current=>current.filter(x=>x.id!==id));setDirty(true);setMessage("Removal staged. Save inventory to store it.");
 };
 const save=async()=>{
  if(saving)return;
  setSaving(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/owner/inventory",{method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({items,version,scope})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.error||"Inventory save failed.");
   setVersion(result.version||null);setDirty(false);setMessage("Inventory saved. Stock levels are now up to date.");
  }catch(e){setError(e instanceof Error?e.message:"Inventory save failed.");}
  finally{setSaving(false);}
 };
 return <div className="min-h-screen bg-[#141413] p-4 pb-28 text-[#f3ece1] sm:p-7">
  <div className="mx-auto max-w-[1300px]">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Operations</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Supply inventory</h1>
      <p className="mt-2 text-sm text-[#b4ab9e]">Keep track of cleaners, coatings, towels, tools, and low-stock supplies for your mobile setups.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {isOwner&&<a href="/owner/deleted-history" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Deleted history</a>}
      {isOwner&&<a href="/owner/admins?tab=teams" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Manage teams</a>}
      <button type="button" onClick={()=>edit(fresh())} className="rounded-xl bg-[#d6b779] px-5 py-3 text-sm font-bold text-[#171715]">Add inventory item</button>
    </div>
   </header>
   {isOwner&&<section className="mt-5 rounded-2xl border border-[#d6b779]/25 bg-[#211f1e] p-4">
     <label className="block text-sm font-semibold text-[#e8d1a2]">Whose supplies are you viewing?
       <select className={INPUT+" mt-2"} value={scope} onChange={e=>{
         if(dirty&&!window.confirm("Discard unsaved inventory changes before switching?"))return;
         setItems([]);setDraft(null);setScope(e.target.value);
       }}>{scopes.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>
     </label>
     <p className="mt-2 text-xs text-[#b4ab9e]">Each detailer has a separate supply list. Switching lists never mixes their supplies with yours.</p>
   </section>}
   <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[
      {label:"In stock",value:inStock.length},
      {label:"Needs ordering",value:low.length},
      {label:"On order",value:onOrder.length},
      {label:"Stock value estimate",value:money(stockValue)},
    ].map(x=><div key={x.label} className="rounded-2xl border border-white/10 bg-[#211f1e] p-4">
      <p className="text-xs text-[#aaa194]">{x.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#f5ebd9]">{loading?"—":x.value}</p>
    </div>)}
   </section>
   {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-900/20 p-4 text-sm text-red-100">{error}</p>}
   {message&&<p role="status" className="mt-5 rounded-xl border border-[#d6b779]/25 bg-[#2d271f] p-4 text-sm text-[#e7cfa2]">{message}</p>}
   {!loading&&low.length>0&&<section className="mt-6 rounded-2xl border border-white/15 bg-[#211f1e] p-4 sm:p-5">
     <h2 className="text-lg font-semibold">Needs ordering <span className="text-[#d6b779]">· {low.length}</span></h2>
     <div className="mt-2 divide-y divide-white/10">
       {low.map(item=><button type="button" key={item.id} onClick={()=>edit(item)} className="flex w-full items-center justify-between gap-3 py-4 text-left">
         <span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span>
           <span className="mt-1 block text-xs text-[#b4ab9e]">{item.quantity} {item.unit} · reorder at {item.reorderAt}</span></span>
         <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold "+(item.quantity===0?"bg-red-900/30 text-red-200":"bg-amber-900/30 text-amber-200")}>{item.quantity===0?"Out":"Low"}</span>
       </button>)}
     </div>
   </section>}
   {onOrder.length>0&&<section className="mt-6 rounded-2xl border border-[#d6b779]/25 bg-[#25221c] p-4 sm:p-5">
      <h2 className="text-base font-semibold">On order</h2>
      <p className="mt-1 text-xs text-[#afa493]">Incoming supplies are recorded separately from stock already on hand.</p>
      <div className="mt-3 divide-y divide-white/10">
        {onOrder.map(x=><div key={x.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#f0e4d4]">{x.name}</p>
            <p className="mt-1 text-[11px] text-[#b7a98e]">{x.onOrder} {x.unit} ordered</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#d6b779]/25 bg-[#3c3323] px-2.5 py-1 text-[11px] font-semibold text-[#e8d1a2]">{x.eta?"ETA "+x.eta:"ETA not set"}</span>
        </div>)}
      </div>
    </section>}
   <section className="mt-6 rounded-2xl border border-white/10 bg-[#1f1e1d]">
    <div className="flex flex-wrap items-end gap-3 border-b border-white/10 p-4 sm:p-5">
      <label className="min-w-[180px] flex-1 text-xs font-semibold text-[#c6bbae]">Search stock
       <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Product or supply name" className={INPUT}/>
      </label>
      <label className="min-w-[180px] text-xs font-semibold text-[#c6bbae]">Category
       <select value={category} onChange={e=>setCategory(e.target.value)} className={INPUT}>
         {["All",...CATEGORIES].map(x=><option key={x} value={x}>{x}</option>)}
       </select>
      </label>
      <label className="flex items-center gap-2 pb-3 text-xs text-[#d7cbbc]">
       <input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)} className="accent-[#d6b779]"/> Low stock only
      </label>
    </div>
    <div className="divide-y divide-white/10">
      {loading?<p className="px-5 py-12 text-center text-sm text-[#ada397]">Loading your inventory…</p>
      :filtered.length===0?<p className="px-5 py-12 text-center text-sm text-[#ada397]">No supplies found. Add your first item or adjust the filters.</p>
      :filtered.map(item=><div key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-4 hover:bg-white/[.025] sm:px-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d6b779]/20 bg-[#d6b779]/10 text-[#d6b779]"><OwnerAppIcon name="calculator" className="h-5 w-5"/></div>
        <div className="min-w-[140px] flex-1">
          <p className="text-sm font-semibold text-[#f4ebe0]">{item.name}</p>
          <p className="mt-1 text-[11px] text-[#a9a093]">{item.category}{item.notes?" · "+item.notes:""}</p>
        </div>
        <div className="min-w-[110px]"><p className="text-[10px] text-[#aaa194]">On hand</p><p className="mt-1 text-sm font-semibold tabular-nums">{item.quantity} {item.unit}</p></div>
        <div className="min-w-[100px]"><p className="text-[10px] text-[#aaa194]">Reorder at</p><p className="mt-1 text-sm">{item.reorderAt} {item.unit}</p></div>
        {item.quantity<=item.reorderAt?<span className="rounded-full border border-[#ac8156]/45 bg-[#443124] px-3 py-1 text-[11px] font-semibold text-[#f2c59a]">{item.quantity===0?"Out of stock":"Low stock"}</span>
         :<span className="rounded-full border border-[#567b64]/40 bg-[#283e30] px-3 py-1 text-[11px] font-semibold text-[#b7dbc4]">In stock</span>}
        {(item.onOrder||0)>0&&<span className="rounded-full border border-[#d6b779]/30 bg-[#3c3323] px-3 py-1 text-[11px] font-semibold text-[#e8d1a2]">On order</span>}
        <button type="button" onClick={()=>edit(item)} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[#d6b779]/50">Edit</button>
        <button type="button" onClick={()=>remove(item.id)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-200 hover:border-red-300/50">Remove</button>
      </div>)}
    </div>
   </section>
   <div className="crm-save-bar sticky bottom-3 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6b779]/30 bg-[#1d1b18]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
     <p className="text-xs text-[#d8c5a3]">{dirty?"Unsaved changes — save to keep this inventory.":"This stock list belongs only to its selected detailer or the owner."}</p>
     <div className="flex gap-2">
       <button type="button" onClick={()=>void reload()} disabled={loading||saving} className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold disabled:opacity-50">Reload</button>
       <button type="button" onClick={()=>void save()} disabled={!dirty||saving} className="rounded-xl bg-[#d6b779] px-5 py-2.5 text-xs font-bold text-[#171717] disabled:opacity-40">{saving?"Saving…":"Save inventory"}</button>
     </div>
   </div>
  </div>

  {draft&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Edit inventory item">
    <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#1f1e1c] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Inventory item</h2>
        <button type="button" onClick={()=>setDraft(null)} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Cancel</button></div>
      <form onSubmit={e=>{e.preventDefault();commitDraft();}} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-[#c9bdac] sm:col-span-2">Name
          <input required maxLength={140} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} className={INPUT} placeholder="e.g. Gyeon Foam 5L"/>
        </label>
        <label className="text-xs text-[#c9bdac]">Category
          <select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} className={INPUT}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
        </label>
        <label className="text-xs text-[#c9bdac]">Unit
          <select value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value})} className={INPUT}>{UNITS.map(u=><option key={u}>{u}</option>)}</select>
        </label>
        <label className="text-xs text-[#c9bdac]">Quantity on hand
          <input type="number" min="0" step=".01" required value={draft.quantity} onChange={e=>setDraft({...draft,quantity:Number(e.target.value)})} className={INPUT}/>
        </label>
        <label className="text-xs text-[#c9bdac]">Alert when quantity is at or below
          <input type="number" min="0" step=".01" required value={draft.reorderAt} onChange={e=>setDraft({...draft,reorderAt:Number(e.target.value)})} className={INPUT}/>
        </label>
        <label className="text-xs text-[#c9bdac] sm:col-span-2">Cost per unit (optional, for estimates)
          <input type="number" min="0" step=".01" value={draft.unitCost} onChange={e=>setDraft({...draft,unitCost:Number(e.target.value)})} className={INPUT}/>
        </label>
        <label className="text-xs text-[#c9bdac]">Quantity on order (not yet delivered)
          <input type="number" min="0" step=".01" value={draft.onOrder||0}
            onChange={e=>setDraft({...draft,onOrder:Number(e.target.value)})} className={INPUT}/>
        </label>
        <label className="text-xs text-[#c9bdac]">Expected arrival date
          <input type="date" value={draft.eta||""} onChange={e=>setDraft({...draft,eta:e.target.value})}
            className={INPUT}/>
        </label>
        <p className="text-[11px] leading-5 text-[#ada293] sm:col-span-2">When an order arrives, increase Quantity on hand and reduce Quantity on order. This tracker does not place purchases automatically.</p>
        <label className="text-xs text-[#c9bdac] sm:col-span-2">Notes
          <textarea rows={3} maxLength={800} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} className={INPUT} placeholder="Storage location or notes"/>
        </label>
        <div className="sm:col-span-2"><button type="submit" className="w-full rounded-xl bg-[#d6b779] px-5 py-3.5 text-sm font-bold text-[#171717]">Apply changes</button></div>
      </form>
    </div>
  </div>}
 </div>;
}
