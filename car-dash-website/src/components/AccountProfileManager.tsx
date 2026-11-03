"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EMPTY_ACCOUNT_PROFILE,formatSavedAddress,type AccountProfile,type SavedAddress } from "@/lib/account-profile";

type CurrentUser={id:string;name:string;email:string;role:string};
type SavedVehicle={
 id:string;nickname:string|null;year:string;make:string;model:string;
 trim:string|null;vehicleType:string;color:string|null;
};
type VehicleForm={nickname:string;year:string;make:string;model:string;trim:string;vehicleType:string;color:string};
const defaultVehicle:VehicleForm={nickname:"",year:"",make:"",model:"",trim:"",vehicleType:"Sedan",color:""};
const blankAddress=():SavedAddress=>({id:"addr_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),
 label:"Home",line1:"",line2:"",city:"",state:"IL",postalCode:"",instructions:""});
const INPUT="mt-1.5 w-full rounded-xl border border-white/20 bg-[#292724] px-3.5 py-3 text-base text-[#f5ecdf] outline-none placeholder:text-[#8f887e] focus:border-[#d6b779]";
const PANEL="rounded-2xl border border-white/10 bg-[#201e1b] p-4 sm:p-6";
const BUTTON="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-[#e9ddca] hover:border-[#d6b779]/60";
function vehicleToForm(value:SavedVehicle):VehicleForm{
 return {nickname:value.nickname||"",year:value.year,make:value.make,model:value.model,
 trim:value.trim||"",vehicleType:value.vehicleType,color:value.color||""};
}
async function compressAvatar(file:File):Promise<string>{
 if(file.size>8*1024*1024)throw new Error("Choose an image under 8 MB.");
 if(!["image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type))
   throw new Error("Choose a JPEG, PNG, WebP, or supported iPhone photo.");
 const src=URL.createObjectURL(file);
 try{
   const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
     const value=new Image();
     value.onload=()=>resolve(value);
     value.onerror=()=>reject(new Error("This photo could not be read by your browser."));
     value.src=src;
   });
   if(image.naturalWidth<8||image.naturalHeight<8)throw new Error("Choose a larger photo.");
   const canvas=document.createElement("canvas");
   canvas.width=256;canvas.height=256;
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("This browser could not prepare the image.");
   const side=Math.min(image.naturalWidth,image.naturalHeight);
   ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
   for(const quality of [.8,.65,.5,.4]){
     const data=canvas.toDataURL("image/jpeg",quality);
     if(data.length<=150000)return data;
   }
   throw new Error("Photo is too large. Try a different image.");
 }finally{URL.revokeObjectURL(src);}
}
export default function AccountProfileManager(){
 const pathname=usePathname();
 const backHref=pathname.startsWith("/owner/")?"/owner/dashboard":pathname.startsWith("/admin/")?"/admin/dashboard":"/dashboard";
 const [user,setUser]=useState<CurrentUser|null>(null);
 const [name,setName]=useState("");
 const [profile,setProfile]=useState<AccountProfile>({...EMPTY_ACCOUNT_PROFILE});
 const [vehicles,setVehicles]=useState<SavedVehicle[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [avatarBusy,setAvatarBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [editingAddress,setEditingAddress]=useState<SavedAddress|null>(null);
 const [editingVehicle,setEditingVehicle]=useState<VehicleForm|null>(null);
 const [editingVehicleId,setEditingVehicleId]=useState<string|null>(null);
 const [vehicleBusy,setVehicleBusy]=useState(false);
 const [vehicleError,setVehicleError]=useState("");
 const load=useCallback(async()=>{
   const response=await fetch("/api/account-profile",{cache:"no-store"});
   if(response.status===401){window.location.assign("/login");return;}
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||"Could not load your profile.");
   setUser(payload.user);setName(payload.user.name);
   setProfile(payload.profile||{...EMPTY_ACCOUNT_PROFILE});
   setVehicles(Array.isArray(payload.vehicles)?payload.vehicles:[]);
 },[]);
 useEffect(()=>{
   let active=true;
   load().catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load profile.");})
     .finally(()=>{if(active)setLoading(false);});
   return()=>{active=false;};
 },[load]);
 const save=async(event:React.FormEvent)=>{
   event.preventDefault();setSaving(true);setError("");setNotice("");
   try{
     const response=await fetch("/api/account-profile",{method:"PUT",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({name,profile})});
     const payload=await response.json().catch(()=>({}));
     if(!response.ok)throw new Error(payload.error||"Profile could not be saved.");
     setUser(payload.user);setName(payload.user.name);setProfile(payload.profile);
     setNotice("Profile saved. Your details will be available on this account next time.");
     window.dispatchEvent(new Event("car-dash-profile-updated"));
   }catch(e){setError(e instanceof Error?e.message:"Unable to save profile.");}
   finally{setSaving(false);}
 };
 const upload=async(event:React.ChangeEvent<HTMLInputElement>)=>{
   const file=event.target.files?.[0];event.target.value="";
   if(!file)return;
   setAvatarBusy(true);setError("");setNotice("");
   try{const avatar=await compressAvatar(file);setProfile(prev=>({...prev,avatar}));
     setNotice("New photo ready. Press Save profile to keep it.");}
   catch(e){setError(e instanceof Error?e.message:"Unable to prepare photo.");}
   finally{setAvatarBusy(false);}
 };
 const saveAddress=(event:React.FormEvent)=>{
   event.preventDefault();if(!editingAddress)return;
   const address=editingAddress;
   if(!address.line1.trim()||!address.city.trim()||!address.state.trim()||!address.postalCode.trim()){
     setError("Street, city, state, and ZIP code are required for an address.");return;
   }
   setProfile(prev=>{
     const exists=prev.addresses.some(a=>a.id===address.id);
     return {...prev,addresses:exists?prev.addresses.map(a=>a.id===address.id?address:a):[...prev.addresses,address],
       defaultAddressId:prev.defaultAddressId||address.id};
   });
   setEditingAddress(null);setNotice("Address staged. Save profile to keep it.");setError("");
 };
 const removeAddress=(id:string)=>{
   if(!confirm("Remove this saved address?"))return;
   setProfile(prev=>{
     const remaining=prev.addresses.filter(x=>x.id!==id);
     return {...prev,addresses:remaining,
       defaultAddressId:prev.defaultAddressId===id?(remaining[0]?.id||null):prev.defaultAddressId};
   });
   setNotice("Address removed from draft. Save profile to confirm.");
 };
 const saveVehicle=async(event:React.FormEvent)=>{
   event.preventDefault();if(!editingVehicle)return;
   setVehicleBusy(true);setVehicleError("");
   try{
     const response=await fetch(editingVehicleId?"/api/vehicles/"+encodeURIComponent(editingVehicleId):"/api/vehicles",{
       method:editingVehicleId?"PUT":"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify(editingVehicle),
     });
     const payload=await response.json().catch(()=>({}));
     if(!response.ok)throw new Error(payload.error||"Could not save your vehicle.");
     const fresh=await fetch("/api/vehicles",{cache:"no-store"});
     if(fresh.ok)setVehicles(await fresh.json());
     setEditingVehicle(null);setEditingVehicleId(null);
     setNotice(editingVehicleId?"Vehicle updated.":"Vehicle saved to your account.");
   }catch(e){setVehicleError(e instanceof Error?e.message:"Unable to save vehicle.");}
   finally{setVehicleBusy(false);}
 };
 const deleteVehicle=async(vehicle:SavedVehicle)=>{
   if(!confirm("Remove "+vehicle.year+" "+vehicle.make+" "+vehicle.model+" from your account?"))return;
   setVehicleError("");
   try{
     const response=await fetch("/api/vehicles/"+encodeURIComponent(vehicle.id),{method:"DELETE"});
     if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.error||"Could not remove vehicle.");}
     setVehicles(prev=>prev.filter(x=>x.id!==vehicle.id));setNotice("Vehicle removed.");
   }catch(e){setVehicleError(e instanceof Error?e.message:"Vehicle removal failed.");}
 };
 if(loading)return <main className="min-h-screen bg-[#121211] p-6 text-[#e9dece]"><p className="mx-auto max-w-5xl">Loading your profile…</p></main>;
 if(!user)return <main className="min-h-screen bg-[#121211] p-6 text-[#e9dece]">{error||"Could not load your profile."}</main>;
 return <main className="min-h-screen bg-[#121211] px-4 py-6 text-[#f2e9dc] sm:px-7 sm:py-10">
   <div className="mx-auto max-w-[1100px] space-y-6">
     <header className="flex flex-wrap items-center justify-between gap-3">
       <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d6b779]">Car Dash · Account</p>
         <h1 className="mt-2 text-3xl font-semibold tracking-tight">My profile</h1>
         <p className="mt-2 text-sm text-[#b1a89c]">Save your information once for your account. Only you can edit your personal profile and garage.</p>
       </div>
       <Link href={backHref} className={BUTTON}>Back to dashboard</Link>
     </header>
     {error&&<p role="alert" className="rounded-xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-100">{error}</p>}
     {notice&&<p role="status" className="rounded-xl border border-[#d6b779]/25 bg-[#30291e] p-4 text-sm text-[#ead4a9]">{notice}</p>}
     <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.92fr)]">
       <form id="my-account-profile-form" onSubmit={save} className={PANEL+" space-y-5"}>
         <div className="flex items-center gap-4 border-b border-white/10 pb-5">
           <div className="grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#d6b779]/40 bg-[#30291e]">
             {profile.avatar?<img src={profile.avatar} alt="Your profile photo" className="h-full w-full object-cover"/>:
             <span className="text-3xl font-semibold text-[#e6cca0]">{name.slice(0,1).toUpperCase()||"C"}</span>}
           </div>
           <div className="min-w-0">
             <h2 className="text-lg font-semibold">Profile photo</h2>
             <p className="mt-1 text-xs leading-5 text-[#ada396]">Square-cropped and saved privately with your account.</p>
             <div className="mt-2 flex flex-wrap items-center gap-3">
               <label className="cursor-pointer rounded-lg border border-[#d6b779]/40 px-3 py-2 text-xs font-semibold text-[#e7d2aa]">
                 {avatarBusy?"Preparing…":"Choose photo"}
                 <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={upload} disabled={avatarBusy} className="sr-only"/>
               </label>
               {profile.avatar&&<button type="button" onClick={()=>setProfile(prev=>({...prev,avatar:null}))} className="text-xs text-[#c4b6a3] underline">Remove</button>}
             </div>
           </div>
         </div>
         <h2 className="text-lg font-semibold">Personal and contact information</h2>
         <label className="block text-xs font-semibold text-[#d8cbbb]">Full name
           <input value={name} onChange={e=>setName(e.target.value)} required maxLength={100} autoComplete="name" className={INPUT}/>
         </label>
         <label className="block text-xs font-semibold text-[#d8cbbb]">Account email
           <input value={user.email} disabled type="email" className={INPUT+" cursor-not-allowed opacity-65"}/>
           <span className="mt-1.5 block text-[11px] font-normal leading-5 text-[#aca294]">Used for sign-in; cannot be changed here.</span>
         </label>
         <label className="block text-xs font-semibold text-[#d8cbbb]">Phone number
           <input value={profile.phone} onChange={e=>setProfile(prev=>({...prev,phone:e.target.value}))}
             type="tel" autoComplete="tel" maxLength={26} placeholder="(630) 555-0123" className={INPUT}/>
         </label>
         <label className="block text-xs font-semibold text-[#d8cbbb]">Preferred way to be contacted
           <select value={profile.contactPreference} onChange={e=>setProfile(prev=>({...prev,contactPreference:e.target.value as AccountProfile["contactPreference"]}))} className={INPUT}>
             <option value="sms">Text message</option><option value="call">Phone call</option><option value="email">Email</option>
           </select>
           <span className="mt-1.5 block text-[11px] font-normal text-[#a99e90]">Your preference doesn't automatically opt you into marketing texts.</span>
         </label>
         <div className="flex items-center justify-between border-t border-white/10 pt-5">
           <h2 className="text-lg font-semibold">Saved addresses</h2>
           <button type="button" disabled={profile.addresses.length>=8} onClick={()=>setEditingAddress(blankAddress())}
             className={BUTTON+" disabled:opacity-40"}>Add address</button>
         </div>
         {profile.addresses.length===0?<p className="rounded-xl border border-dashed border-white/15 p-4 text-xs leading-6 text-[#aaa092]">No saved addresses yet. Add your home, workplace, or another mobile-detailing location.</p>:
           <div className="space-y-2">{profile.addresses.map(a=><div key={a.id} className="rounded-xl border border-white/10 bg-[#292722] p-3.5">
             <div className="flex flex-wrap items-center justify-between gap-2">
               <p className="text-sm font-semibold">{a.label||"Saved address"}</p>
               {a.id===profile.defaultAddressId&&<span className="rounded-full border border-[#d6b779]/35 bg-[#d6b779]/10 px-2 py-1 text-[10px] font-semibold text-[#e4ca99]">Default</span>}
             </div>
             <p className="mt-2 text-xs leading-6 text-[#baafa1]">{formatSavedAddress(a)}</p>
             {a.instructions&&<p className="mt-1 text-[11px] leading-5 text-[#a49a8d]">{a.instructions}</p>}
             <div className="mt-3 flex flex-wrap gap-3">
               {a.id!==profile.defaultAddressId&&<button type="button" onClick={()=>setProfile(prev=>({...prev,defaultAddressId:a.id}))} className="text-xs font-semibold text-[#e6cea1]">Set default</button>}
               <button type="button" onClick={()=>setEditingAddress({...a})} className="text-xs font-semibold text-[#e6cea1]">Edit</button>
               <button type="button" onClick={()=>removeAddress(a.id)} className="text-xs text-red-200">Remove</button>
             </div>
           </div>)}</div>}
         <div className="border-t border-white/10 pt-5">
           <button type="submit" disabled={saving||avatarBusy} className="w-full rounded-xl bg-[#d6b779] px-5 py-3.5 text-sm font-bold text-[#181715] disabled:opacity-40">{saving?"Saving…":"Save profile & addresses"}</button>
           <p className="mt-2 text-center text-[11px] text-[#ada395]">Your profile stays with your account across devices.</p>
         </div>
       </form>

       <section className={PANEL+" h-fit space-y-4"}>
         <div className="flex items-center justify-between gap-3">
           <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#d6b779]">Saved garage</p>
             <h2 className="mt-1 text-xl font-semibold">My vehicles</h2></div>
           <button type="button" onClick={()=>{setEditingVehicle({...defaultVehicle});setEditingVehicleId(null);setVehicleError("");}} className={BUTTON}>Add car</button>
         </div>
         <p className="text-xs leading-6 text-[#aaa092]">Year, make, model, trim, color, and vehicle size. These saved vehicles can be selected during bookings and quotes.</p>
         {vehicleError&&<p role="alert" className="rounded-lg border border-red-400/20 bg-red-900/20 p-3 text-xs text-red-200">{vehicleError}</p>}
         {vehicles.length===0?<div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa092]">No vehicles saved yet.</div>:
           <div className="space-y-3">{vehicles.map(car=><article key={car.id} className="rounded-xl border border-white/10 bg-[#292722] p-4">
             <div className="flex items-start justify-between gap-3">
               <div><p className="text-sm font-semibold text-[#f4e9db]">{car.nickname||car.year+" "+car.make+" "+car.model}</p>
                 {car.nickname&&<p className="mt-1 text-xs text-[#b9ac9e]">{car.year} {car.make} {car.model} {car.trim||""}</p>}
                 <p className="mt-2 text-[11px] text-[#ad9f8e]">{[car.vehicleType,car.color,car.trim].filter(Boolean).join(" · ")}</p></div>
             </div>
             <div className="mt-4 flex flex-wrap gap-2">
               <button type="button" onClick={()=>{setEditingVehicle(vehicleToForm(car));setEditingVehicleId(car.id);setVehicleError("");}} className={BUTTON}>Edit vehicle</button>
               <button type="button" onClick={()=>void deleteVehicle(car)} className={BUTTON+" text-red-200"}>Remove</button>
             </div>
           </article>)}</div>}
         <div className="rounded-xl border border-[#d6b779]/20 bg-[#2c271f] p-4">
           <p className="text-xs font-semibold text-[#e9d3a8]">Your account stays private</p>
           <p className="mt-2 text-[11px] leading-6 text-[#bfb19d]">Only your signed-in account can update this profile and its vehicles. Never store payment-card numbers or passwords in address notes.</p>
         </div>
       </section>
     </div>
   </div>
   {editingAddress&&<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Edit saved address">
     <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#201e1b] p-5 sm:p-7">
       <h2 className="text-xl font-semibold">Saved address</h2>
       <form onSubmit={saveAddress} className="mt-5 grid gap-3 sm:grid-cols-2">
         {([
           ["label","Label","Home or work"],["line1","Street address","123 Main St"],
           ["line2","Unit / apartment","Optional"],["city","City","South Elgin"],
           ["state","State","IL"],["postalCode","ZIP code","60177"],
         ] as const).map(([key,label,placeholder])=><label key={key} className={"text-xs font-semibold text-[#d7cab9] "+(["line1","line2"].includes(key)?"sm:col-span-2":"")}>
           {label}<input required={["line1","city","state","postalCode"].includes(key)} placeholder={placeholder}
             maxLength={key==="line1"||key==="line2"?160:key==="label"?45:key==="city"?80:key==="state"?40:16}
             value={editingAddress[key]} onChange={e=>setEditingAddress(prev=>prev?{...prev,[key]:e.target.value}:null)}
             className={INPUT}/>
         </label>)}
         <label className="text-xs font-semibold text-[#d7cab9] sm:col-span-2">Arrival or parking notes (optional)
           <textarea rows={3} maxLength={350} value={editingAddress.instructions}
             onChange={e=>setEditingAddress(prev=>prev?{...prev,instructions:e.target.value}:null)}
             placeholder="Driveway, gate instructions, parking location…" className={INPUT}/>
         </label>
         <div className="mt-3 flex flex-wrap gap-2 sm:col-span-2">
           <button type="button" onClick={()=>setEditingAddress(null)} className={BUTTON+" flex-1"}>Cancel</button>
           <button type="submit" className="flex-1 rounded-xl bg-[#d6b779] px-4 py-3 text-xs font-bold text-[#171613]">Apply address</button>
         </div>
       </form>
     </div>
   </div>}
   {editingVehicle&&<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Edit saved car">
     <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#201e1b] p-5 sm:p-7">
       <h2 className="text-xl font-semibold">{editingVehicleId?"Edit vehicle":"Add vehicle"}</h2>
       {vehicleError&&<p role="alert" className="mt-3 text-xs text-red-200">{vehicleError}</p>}
       <form onSubmit={saveVehicle} className="mt-4 grid gap-3 sm:grid-cols-2">
         {(["nickname","year","make","model","trim","color"] as const).map(key=><label key={key}
           className={"text-xs font-semibold capitalize text-[#d7cab9] "+(key==="nickname"?"sm:col-span-2":"")}>
           {key}<input value={editingVehicle[key]} required={["year","make","model"].includes(key)}
             maxLength={key==="year"?4:80} placeholder={key==="year"?"2026":key==="make"?"Tesla":key==="model"?"Model Y":""}
             onChange={e=>setEditingVehicle(prev=>prev?{...prev,[key]:e.target.value}:null)} className={INPUT}/>
         </label>)}
         <label className="text-xs font-semibold text-[#d7cab9] sm:col-span-2">Vehicle category
           <select value={editingVehicle.vehicleType} onChange={e=>setEditingVehicle(prev=>prev?{...prev,vehicleType:e.target.value}:null)} className={INPUT}>
             {["Sedan","Coupe","SUV","Truck","Van","Marine"].map(type=><option key={type}>{type}</option>)}
           </select>
         </label>
         <div className="mt-3 flex gap-2 sm:col-span-2">
           <button type="button" onClick={()=>setEditingVehicle(null)} className={BUTTON+" flex-1"}>Cancel</button>
           <button type="submit" disabled={vehicleBusy} className="flex-1 rounded-xl bg-[#d6b779] px-4 py-3 text-xs font-bold text-[#171613] disabled:opacity-40">{vehicleBusy?"Saving…":"Save vehicle"}</button>
         </div>
       </form>
     </div>
   </div>}
 </main>;
}
