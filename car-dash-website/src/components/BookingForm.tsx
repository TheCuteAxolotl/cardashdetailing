"use client";

import { useState } from "react";

const initialState = {
  name: "",
  phone: "",
  email: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleTrim: "",
  serviceNotes: "",
  preferredDate: "",
  selectedPackage: "",
  serviceMethod: "shop",
  vehicleType: "Sedan",
  interiorCondition: "Light",
  exteriorCondition: "Light",
  addOns: [],
  smsConsent: false,
  policyAgreed: false,
};

export default function BookingForm({
  prefill,
  onClose,
}: {
  prefill?: { service?: string };
  onClose?: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({ ...initialState, selectedPackage: prefill?.service || "", serviceMethod: "shop", vehicleType: "Sedan", interiorCondition: "Light", exteriorCondition: "Light", addOns: [] }));
  const [images, setImages] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current: any) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const fileArray = Array.from(event.target.files).slice(0, 3);
    setImages(fileArray);
  };

  const toggleAddOn = (label: string) => {
    setForm((cur: any) => {
      const has = cur.addOns?.includes(label);
      return { ...cur, addOns: has ? cur.addOns.filter((l: string) => l !== label) : [...(cur.addOns || []), label] };
    });
  };

  const PRICE_MAP: Record<string, { shop: string; delivery: string; mobile: string }> = {
    "Basic Detail": { shop: "$159", delivery: "$189", mobile: "$209" },
    "Premium Detail": { shop: "$219", delivery: "$249", mobile: "$279" },
    "Ultimate Detail": { shop: "$399", delivery: "$449", mobile: "$499" },
  };

  const addOnsList = [
    { label: "Pet Hair Removal", price: "$39" },
    { label: "Seat Shampoo", price: "$49" },
    { label: "Carpet Extraction", price: "$59" },
    { label: "Heavy Stain Removal", price: "$69" },
    { label: "Headliner Spot Treatment", price: "$39" },
    { label: "Leather Protection", price: "$39" },
    { label: "Odor Treatment", price: "$49" },
    { label: "Engine Bay Cleaning", price: "$49" },
    { label: "Iron Decontamination", price: "$45" },
    { label: "Clay Bar Treatment", price: "$59" },
    { label: "Headlight Restoration", price: "$120" },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const payload = {
        selectedPackage: form.selectedPackage,
        serviceMethod: form.serviceMethod,
        name: form.name,
        phone: form.phone,
        email: form.email,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vehicleYear: form.vehicleYear,
        vehicleTrim: form.vehicleTrim,
        serviceNotes: form.serviceNotes,
        preferredDate: form.preferredDate,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit booking request.");
      }

      setStatus("success");
      setMessage(data.message || "Booking request submitted. We’ll contact you shortly.");
      setForm({ ...initialState, selectedPackage: form.selectedPackage || "", serviceMethod: form.serviceMethod || "shop" });
      setImages([]);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit booking request.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {prefill?.service && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300">
          Booking: <span className="font-semibold text-white">{prefill.service}</span>
        </div>
      )}
      {/* Package & pricing */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm font-medium text-neutral-300">Selected package</p>
        <p className="mt-1 text-lg font-semibold text-white">{form.selectedPackage || "Custom"}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {['shop','delivery','mobile'].map((method) => {
            const label = method === 'shop' ? 'Drop-Off / Shop' : method === 'delivery' ? 'Delivery Service' : 'Mobile Service';
            const price = PRICE_MAP[form.selectedPackage] ? PRICE_MAP[form.selectedPackage][method as 'shop'|'delivery'|'mobile'] : '-';
            return (
              <label key={method} className="inline-flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                <input
                  type="radio"
                  name="serviceMethod"
                  value={method}
                  checked={form.serviceMethod === method}
                  onChange={(e) => setForm((cur: any) => ({ ...cur, serviceMethod: e.target.value }))}
                  className="h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-neutral-300">{label}</span>
                  <span className="text-sm font-semibold text-white">{price}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Full name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Phone number</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            type="tel"
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Vehicle type</span>
          <select
            name="vehicleType"
            value={form.vehicleType}
            onChange={(e) => setForm((cur: any) => ({ ...cur, vehicleType: e.target.value }))}
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none"
          >
            <option>Sedan</option>
            <option>SUV</option>
            <option>Truck</option>
            <option>Van</option>
            <option>Other</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Make</span>
          <input name="vehicleMake" value={form.vehicleMake} onChange={handleChange} className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Model</span>
          <input name="vehicleModel" value={form.vehicleModel} onChange={handleChange} className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Year</span>
          <input name="vehicleYear" value={form.vehicleYear} onChange={handleChange} type="number" className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Preferred date</span>
          <input name="preferredDate" value={form.preferredDate} onChange={handleChange} type="date" className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Preferred time</span>
          <input name="preferredTime" value={form.preferredTime || ''} onChange={(e) => setForm((cur:any)=>({...cur, preferredTime: e.target.value}))} type="time" className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
        </label>
        {form.serviceMethod !== 'shop' && (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Service address</span>
            <input name="serviceAddress" value={form.serviceAddress || ''} onChange={(e)=>setForm((cur:any)=>({...cur, serviceAddress: e.target.value}))} placeholder="Required for delivery or mobile" className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none" />
          </label>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Email address</span>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            required
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Preferred appointment</span>
          <input
            name="preferredDate"
            value={form.preferredDate}
            onChange={handleChange}
            placeholder="Date or time window"
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Vehicle make</span>
          <input
            name="vehicleMake"
            value={form.vehicleMake}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Vehicle model</span>
          <input
            name="vehicleModel"
            value={form.vehicleModel}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Vehicle year</span>
          <input
            name="vehicleYear"
            value={form.vehicleYear}
            onChange={handleChange}
            required
            type="number"
            min="1900"
            max="2099"
            className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-white">Trim, package, or style</span>
        <input
          name="vehicleTrim"
          value={form.vehicleTrim}
          onChange={handleChange}
          placeholder="Example: Touring, Sport, Luxury"
          className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Interior condition</span>
          <select name="interiorCondition" value={form.interiorCondition} onChange={(e)=>setForm((cur:any)=>({...cur, interiorCondition: e.target.value}))} className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none">
            <option>Light</option>
            <option>Moderate</option>
            <option>Heavy</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Exterior condition</span>
          <select name="exteriorCondition" value={form.exteriorCondition} onChange={(e)=>setForm((cur:any)=>({...cur, exteriorCondition: e.target.value}))} className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none">
            <option>Light</option>
            <option>Moderate</option>
            <option>Heavy</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-white">Service details / Notes</span>
        <textarea
          name="serviceNotes"
          value={form.serviceNotes}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the service you want, condition, or any special instructions."
          className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/30"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-white">Vehicle images (optional)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none"
        />
        <p className="text-xs text-neutral-400">Upload up to 3 images. Optional, but helpful for accurate estimates.</p>
      </label>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm font-medium text-neutral-300">Add-ons</p>
        <div className="mt-3 grid gap-2">
          {addOnsList.map((a) => (
            <label key={a.label} className="inline-flex items-center gap-3">
              <input type="checkbox" checked={form.addOns?.includes(a.label)} onChange={() => toggleAddOn(a.label)} className="h-4 w-4" />
              <span className="text-sm text-neutral-300">{a.label} <span className="text-neutral-500">{a.price}</span></span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Images attached</p>
          <p className="text-sm text-neutral-400">{images.length} file{images.length === 1 ? "" : "s"} selected</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onClose && onClose()}
            className="rounded-full bg-neutral-800 px-5 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-neutral-700"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={status === "submitting" || !form.policyAgreed}
            className="inline-flex items-center justify-center rounded-full bg-red-700 px-7 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting" ? "Sending..." : "Submit booking request"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={form.smsConsent || false} onChange={(e)=>setForm((cur:any)=>({...cur, smsConsent: e.target.checked}))} className="h-4 w-4" />
          <span className="text-sm text-neutral-300">I consent to SMS/text messages regarding my booking.</span>
        </label>

        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={form.policyAgreed || false} onChange={(e)=>setForm((cur:any)=>({...cur, policyAgreed: e.target.checked}))} className="h-4 w-4" />
          <span className="text-sm text-neutral-300">I agree to the booking policy.</span>
        </label>

        {status !== "idle" && (
          <div className={`rounded-3xl border px-4 py-4 text-sm ${status === "success" ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-rose-500/50 bg-rose-950 text-rose-200"}`}>
            {message}
          </div>
        )}
      </div>
    </form>
  );
}
