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
};

export default function BookingForm() {
  const [form, setForm] = useState(initialState);
  const [images, setImages] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const fileArray = Array.from(event.target.files).slice(0, 3);
    setImages(fileArray);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value as string);
      });

      images.forEach((file) => data.append("images", file));

      const response = await fetch("/api/bookings", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to submit booking request.");
      }

      setStatus("success");
      setMessage(result.message || "Booking request submitted successfully.");
      setForm(initialState);
      setImages([]);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Full name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Phone number</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            type="tel"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Email address</span>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Preferred appointment</span>
          <input
            name="preferredDate"
            value={form.preferredDate}
            onChange={handleChange}
            placeholder="Date or time window"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Vehicle make</span>
          <input
            name="vehicleMake"
            value={form.vehicleMake}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Vehicle model</span>
          <input
            name="vehicleModel"
            value={form.vehicleModel}
            onChange={handleChange}
            required
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-900">Vehicle year</span>
          <input
            name="vehicleYear"
            value={form.vehicleYear}
            onChange={handleChange}
            required
            type="number"
            min="1900"
            max="2099"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-900">Trim, package, or style</span>
        <input
          name="vehicleTrim"
          value={form.vehicleTrim}
          onChange={handleChange}
          placeholder="Example: Touring, Sport, Luxury"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-900">Service details</span>
        <textarea
          name="serviceNotes"
          value={form.serviceNotes}
          onChange={handleChange}
          rows={5}
          placeholder="Describe the service you want, condition, or any special instructions."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-900">Vehicle images (optional)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none"
        />
        <p className="text-xs text-slate-500">Upload up to 3 images. Optional, but helpful for accurate estimates.</p>
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">Images attached</p>
          <p className="text-sm text-slate-500">{images.length} file{images.length === 1 ? "" : "s"} selected</p>
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-red-950 px-7 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending..." : "Submit booking request"}
        </button>
      </div>

      {status !== "idle" && (
        <div className={`rounded-3xl border ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"} px-4 py-4 text-sm`}>
          {message}
        </div>
      )}
    </form>
  );
}
