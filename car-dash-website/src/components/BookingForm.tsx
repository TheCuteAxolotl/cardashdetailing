"use client";

import { useState } from "react";

type FormState = {
  name: string; phone: string; email: string; vehicleMake: string; vehicleModel: string; vehicleYear: string; vehicleTrim: string;
  serviceNotes: string; preferredDate: string; preferredTime: string; selectedPackage: string; serviceMethod: string; vehicleType: string;
  serviceAddress: string; interiorCondition: string; exteriorCondition: string; addOns: string[]; smsConsent: boolean; policyAgreed: boolean;
};

const initialState: FormState = { name:"", phone:"", email:"", vehicleMake:"", vehicleModel:"", vehicleYear:"", vehicleTrim:"", serviceNotes:"", preferredDate:"", preferredTime:"", selectedPackage:"", serviceMethod:"shop", vehicleType:"Sedan", serviceAddress:"", interiorCondition:"Light", exteriorCondition:"Light", addOns:[], smsConsent:false, policyAgreed:false };

const addOnsList = ["Pet Hair Removal $39","Seat Shampoo $49","Carpet Extraction $59","Heavy Stain Removal $69","Headliner Spot Treatment $39","Leather Protection $39","Odor Treatment $49","Engine Bay Cleaning $49","Iron Decontamination $45","Clay Bar Treatment $59","Headlight Restoration $120"];

export default function BookingForm({ prefill, onClose }: { prefill?: { service?: string }; onClose?: () => void }) {
  const [form, setForm] = useState<FormState>({ ...initialState, selectedPackage: prefill?.service || "" });
  const [status, setStatus] = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [message, setMessage] = useState("");

  const set = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((f) => ({ ...f, [key]: value } as FormState));
  const toggleAddOn = (item: string) => set("addOns", form.addOns.includes(item) ? form.addOns.filter((x) => x !== item) : [...form.addOns, item]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setStatus("submitting"); setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)));
      const response = await fetch("/api/bookings", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit booking.");
      setStatus("success"); setMessage(data.message || "Booking request submitted.");
      setForm({ ...initialState, selectedPackage: form.selectedPackage });
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to submit booking."); }
  };

  const input = "w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-red-700";
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><p className="text-xs uppercase tracking-wider text-neutral-500">Selected service</p><p className="mt-1 text-lg font-semibold">{form.selectedPackage || "Custom booking"}</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><label>Full name<input required className={input} value={form.name} onChange={(e)=>set("name",e.target.value)} /></label><label>Phone<input required type="tel" className={input} value={form.phone} onChange={(e)=>set("phone",e.target.value)} /></label></div>
      <label>Email<input required type="email" className={input} value={form.email} onChange={(e)=>set("email",e.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label>Service method<select className={input} value={form.serviceMethod} onChange={(e)=>set("serviceMethod",e.target.value)}><option value="shop">Drop-Off / Shop</option><option value="delivery">Delivery</option><option value="mobile">Mobile</option></select></label><label>Vehicle type<select className={input} value={form.vehicleType} onChange={(e)=>set("vehicleType",e.target.value)}><option>Sedan</option><option>SUV</option><option>Truck</option><option>Van</option><option>Other</option></select></label></div>
      {form.serviceMethod !== "shop" && <label>Service address<input required className={input} value={form.serviceAddress} onChange={(e)=>set("serviceAddress",e.target.value)} /></label>}
      <div className="grid gap-4 sm:grid-cols-3"><label>Year<input required type="number" min="1900" max="2099" className={input} value={form.vehicleYear} onChange={(e)=>set("vehicleYear",e.target.value)} /></label><label>Make<input required className={input} value={form.vehicleMake} onChange={(e)=>set("vehicleMake",e.target.value)} /></label><label>Model<input required className={input} value={form.vehicleModel} onChange={(e)=>set("vehicleModel",e.target.value)} /></label></div>
      <label>Trim / package<input className={input} value={form.vehicleTrim} onChange={(e)=>set("vehicleTrim",e.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label>Preferred date<input type="date" className={input} value={form.preferredDate} onChange={(e)=>set("preferredDate",e.target.value)} /></label><label>Preferred time<input type="time" className={input} value={form.preferredTime} onChange={(e)=>set("preferredTime",e.target.value)} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label>Interior condition<select className={input} value={form.interiorCondition} onChange={(e)=>set("interiorCondition",e.target.value)}><option>Light</option><option>Moderate</option><option>Heavy</option></select></label><label>Exterior condition<select className={input} value={form.exteriorCondition} onChange={(e)=>set("exteriorCondition",e.target.value)}><option>Light</option><option>Moderate</option><option>Heavy</option></select></label></div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><p className="mb-3 text-sm font-semibold">Add-ons</p><div className="grid gap-2 sm:grid-cols-2">{addOnsList.map((item)=><label key={item} className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={form.addOns.includes(item)} onChange={()=>toggleAddOn(item)} />{item}</label>)}</div></div>
      <label>Notes<textarea rows={4} className={input} value={form.serviceNotes} onChange={(e)=>set("serviceNotes",e.target.value)} placeholder="Stains, pet hair, coating questions, special instructions…" /></label>
      <label className="flex items-start gap-3 text-sm text-neutral-300"><input type="checkbox" checked={form.smsConsent} onChange={(e)=>set("smsConsent",e.target.checked)} />I consent to SMS/text messages regarding my booking.</label>
      <label className="flex items-start gap-3 text-sm text-neutral-300"><input type="checkbox" checked={form.policyAgreed} onChange={(e)=>set("policyAgreed",e.target.checked)} />I agree to the booking policy.</label>
      {status !== "idle" && <div className={`rounded-2xl border p-4 text-sm ${status==="success"?"border-green-800 bg-green-950/30 text-green-200":"border-red-800 bg-red-950/30 text-red-200"}`}>{message}</div>}
      <div className="flex gap-3"><button type="submit" disabled={status==="submitting" || !form.policyAgreed} className="rounded-full bg-red-700 px-6 py-3 font-semibold hover:bg-red-800 disabled:opacity-50">{status==="submitting"?"Sending…":"Submit booking request"}</button>{onClose && <button type="button" onClick={onClose} className="rounded-full bg-neutral-800 px-6 py-3 font-semibold">Close</button>}</div>
    </form>
  );
}
