"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageMediaBand from "@/components/PageMediaBand";

type Vehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string | null;
  vehicleType?: string;
  nickname: string | null;
};
type Service = { id: string; title: string };
type Msg = { id: string; sender: string; body: string; attachmentsJson: string | null; createdAt: string };
type Thread = {
  id: string;
  subject: string;
  status: string;
  quotedPrice: number | null;
  quoteNotes: string | null;
  vehicle: Vehicle | null;
  service: Service | null;
  messages: Msg[];
};

const input = "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 outline-none transition focus:border-[#6EAEC6]/60 focus:shadow-[0_0_0_3px_rgba(110,174,198,.06)]";

async function compressImage(file: File) {
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  const maxDimension = 1400;
  const ratio = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(source.naturalHeight * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare photo");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(source.src);

  let quality = 0.8;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 580000 && quality > 0.42) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  return result;
}

export default function QuotePage() {
  const [user, setUser] = useState<any>(undefined);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [subject, setSubject] = useState("Exact detailing quote");
  const [condition, setCondition] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [smsConsent, setSmsConsent] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan / Coupe");
  const [guestSubmitted, setGuestSubmitted] = useState<{ id: string; email: string; name: string } | null>(null);
  const end = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const serviceResponse = await fetch("/api/services", { cache: "no-store" }).catch(() => null);
    if (serviceResponse?.ok) setServices((await serviceResponse.json()).filter((x: any) => x.active));

    const query = new URLSearchParams(location.search);
    const serviceFromUrl = query.get("service");
    const packageFromUrl = query.get("package");
    if (serviceFromUrl) setServiceId((current) => current || serviceFromUrl);
    if (packageFromUrl) {
      setSubject((current) => current === "Exact detailing quote" ? `Free photo quote — ${packageFromUrl}` : current);
      setBody((current) => current || `I'm not sure if ${packageFromUrl} is the right fit for my vehicle. Please take a look at the photos and recommend the best option.`);
    }

    const me = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!me?.ok) {
      setUser(null);
      return;
    }

    const md = await me.json();
    setUser(md.user);
    const [v, t] = await Promise.all([
      fetch("/api/vehicles", { cache: "no-store" }),
      fetch("/api/quotes", { cache: "no-store" }),
    ]);
    if (v.ok) setVehicles(await v.json());
    if (t.ok) {
      const ts = await t.json();
      setThreads(ts);
      const tid = query.get("thread");
      if (tid && ts.some((x: Thread) => x.id === tid)) setSelected(tid);
      else if (!selected && ts[0]) setSelected(ts[0].id);
      const vv = query.get("vehicle");
      if (vv) setVehicleId((current) => current || vv);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [user, selected]);

  const active = useMemo(() => threads.find((thread) => thread.id === selected) || null, [threads, selected]);
  const readOnly = Boolean(active && ["closed", "booked"].includes(active.status));

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length]);

  const files = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFiles = [...(event.target.files || [])].slice(0, 3);
    try {
      const urls = await Promise.all(selectedFiles.map(compressImage));
      setPhotos(urls);
    } catch {
      setError("One of those photos could not be prepared. Try a different image.");
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          serviceId,
          subject,
          message: `${condition ? `Vehicle condition: ${condition}.\n\n` : ""}${body}`.trim(),
          attachments: photos,
          smsConsent,
          phone,
          guestName,
          guestEmail,
          guestPhone: phone,
          vehicleYear,
          vehicleMake,
          vehicleModel,
          vehicleType,
        }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not request the quote.");

      if (!user) {
        setGuestSubmitted({ id: data.id, email: guestEmail, name: guestName });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setBody("");
      setCondition("");
      setPhotos([]);
      setSmsConsent(false);
      setPhone("");
      setSelected(data.id);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || readOnly) return;
    setError("");
    const response = await fetch(`/api/quotes/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply, attachments: photos }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Could not send message.");
      await load();
      return;
    }
    setReply("");
    setPhotos([]);
    load();
  };

  const accept = async () => {
    if (!active) return;
    setError("");
    const response = await fetch(`/api/quotes/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Could not accept quote.");
    await load();
  };

  if (user === undefined) return <main className="min-h-screen bg-[#0B1822] p-10 text-white">Loading…</main>;

  if (!user) {
    if (guestSubmitted) {
      const claim = encodeURIComponent(guestSubmitted.id);
      const email = encodeURIComponent(guestSubmitted.email);
      const name = encodeURIComponent(guestSubmitted.name);
      return (
        <main className="min-h-screen bg-[#0B1822] px-5 py-20 text-white sm:px-8">
          <div className="mx-auto max-w-2xl rounded-[32px] border border-emerald-500/20 bg-emerald-500/[.05] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-emerald-300">Quote request received</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em]">Quote request sent. No account needed.</h1>
            <p className="mt-5 text-base leading-8 text-white/55">We have your vehicle details and photos. We’ll look everything over before we price the job. Reference: <span className="font-semibold text-white">#{guestSubmitted.id.slice(-7)}</span>.</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5">
              <h2 className="text-lg font-semibold">Want to save this to an account?</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">You do not need an account, but making one lets you track this quote, save your vehicles, see bookings, and keep warranty info in one place.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={`/register?claimQuoteId=${claim}&email=${email}&name=${name}`} className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-[#0B1822]">Create account + save this quote</a>
                <a href={`/login?claimQuoteId=${claim}&email=${email}`} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">Already have an account?</a>
              </div>
            </div>
            <a href="/" className="mt-6 inline-flex text-sm text-white/45 hover:text-white">← Back to home</a>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-[#0B1822] px-5 py-12 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#6EAEC6]">No login required</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[.92] tracking-[-.06em] sm:text-7xl">Get a Free Custom Quote</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/52">Tell us what you drive, what you want done, and what shape it’s in. Upload a few photos if you can. We’ll customize your quote around your vehicle, its condition, and exactly what you want done.</p>
          </div>

          <PageMediaBand categories={["quote-media"]} theme="dark" compact className="mt-8" />

          <form onSubmit={create} className="mt-10 rounded-[30px] border border-white/10 bg-white/[.025] p-5 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm text-white/65">Your name<input className={`${input} mt-2`} value={guestName} onChange={(e)=>setGuestName(e.target.value)} placeholder="Full name" required /></label>
              <label className="text-sm text-white/65">Email<input type="email" className={`${input} mt-2`} value={guestEmail} onChange={(e)=>setGuestEmail(e.target.value)} placeholder="you@example.com" required /></label>
              <label className="text-sm text-white/65">Phone<input type="tel" className={`${input} mt-2`} value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="(630) 555-0123" required /></label>
              <label className="text-sm text-white/65">Service<select className={`${input} mt-2`} value={serviceId} onChange={(e)=>setServiceId(e.target.value)}><option value="">Not sure yet</option>{services.map((service)=><option key={service.id} value={service.id}>{service.title}</option>)}</select></label>
            </div>

            <div className="mt-7 border-t border-white/10 pt-7">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-white/35">Vehicle</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input className={input} value={vehicleYear} onChange={(e)=>setVehicleYear(e.target.value)} placeholder="Year" />
                <input className={input} value={vehicleMake} onChange={(e)=>setVehicleMake(e.target.value)} placeholder="Make" required />
                <input className={input} value={vehicleModel} onChange={(e)=>setVehicleModel(e.target.value)} placeholder="Model" required />
                <select className={input} value={vehicleType} onChange={(e)=>setVehicleType(e.target.value)}><option>Sedan / Coupe</option><option>Small SUV / Crossover</option><option>Large SUV / Truck</option><option>Van</option><option>Other</option></select>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm text-white/65">How dirty is it right now?<select className={`${input} mt-2`} value={condition} onChange={(e)=>setCondition(e.target.value)}><option value="">Select condition</option><option value="Light / already fairly clean">Light / already fairly clean</option><option value="Average / normal buildup">Average / normal buildup</option><option value="Heavy / needs extra work">Heavy / needs extra work</option><option value="Not sure — please judge from photos">Not sure — judge from photos</option></select></label>
              <textarea className={`${input} min-h-36`} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="What do you want done? Mention things like stains, pet hair, a third row, recent cleaning, paint scratches, oxidation, or anything else we should know." required />
              <label className="cursor-pointer rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45 hover:border-[#6EAEC6]/35">Add up to 3 photos so we can quote it better<input type="file" accept="image/*" multiple onChange={files} className="hidden" /></label>
              {photos.length > 0 && <p className="text-sm text-[#6EAEC6]">{photos.length} photo(s) ready</p>}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-start gap-3 text-sm leading-6 text-white/58"><input type="checkbox" checked={smsConsent} onChange={(e)=>setSmsConsent(e.target.checked)} className="mt-1" /><span><strong className="font-semibold text-white">Yes, text me about my quote and appointment — no spam or promotional messages.</strong> Car Dash Detailing will only text you about your quote, scheduling, appointment updates, or other messages directly related to your service. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.</span></label>
                <p className="mt-3 pl-6 text-xs text-white/30">See our <a href="/privacy-policy" className="text-[#6EAEC6]">Privacy Policy</a> and <a href="/terms-and-conditions" className="text-[#6EAEC6]">Terms</a>.</p>
              </div>

              {error && <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}
              <button disabled={submitting} className="rounded-full bg-[#6EAEC6] px-6 py-3.5 font-semibold text-[#0B1822] disabled:opacity-50">{submitting ? "Sending…" : "Send My Free Quote Request"}</button>
              <p className="text-center text-xs text-white/30">Already a customer? <a href="/login" className="text-white/60 hover:text-white">Sign in</a> to keep the quote in your dashboard.</p>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1822] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-[#6EAEC6]">Condition-based pricing</p>
          <h1 className="mt-2 text-4xl font-semibold">Get a Free Custom Quote</h1>
          <p className="mt-2 max-w-3xl text-white/40">Since you’re signed in, you can reuse saved vehicles and keep the whole quote conversation here. Tell us what you want done and we’ll customize the quote around your vehicle, its condition, and the work you actually want.</p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[26px] border border-white/10 bg-white/[.025] p-3">
            <button onClick={() => setSelected("")} className="mb-3 w-full rounded-2xl bg-[#6EAEC6] px-4 py-3 text-left font-semibold text-[#0B1822]">+ New quote chat</button>
            {threads.map((thread) => <button key={thread.id} onClick={() => setSelected(thread.id)} className={`mb-2 w-full rounded-2xl p-4 text-left ${selected === thread.id ? "bg-white text-black" : "hover:bg-white/5"}`}><p className="font-semibold">{thread.subject}</p><p className={`mt-1 text-xs ${selected === thread.id ? "text-black/50" : "text-white/35"}`}>{thread.status}{thread.quotedPrice ? ` · $${thread.quotedPrice.toFixed(2)}` : ""}</p></button>)}
          </aside>

          <section className="min-h-[650px] rounded-[26px] border border-white/10 bg-white/[.025] p-5">
            {active ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold">{active.subject}</h2><p className="mt-1 text-sm text-white/40">{active.vehicle ? `${active.vehicle.year} ${active.vehicle.make} ${active.vehicle.model}` : "No vehicle selected"} · {active.status}</p></div>{active.status === "accepted" && active.quotedPrice && <a href={`/contact?quote=${encodeURIComponent(active.id)}`} className="rounded-full bg-[#6EAEC6] px-5 py-2.5 text-sm font-semibold text-[#0B1822]">Book Now · ${active.quotedPrice.toFixed(2)}</a>}</div>
                  {active.quotedPrice && <div className="mt-4 rounded-2xl border border-[#6EAEC6]/20 bg-[#6EAEC6]/[.05] p-4"><p className="text-xs uppercase tracking-[.2em] text-[#6EAEC6]">Car Dash Exact Quote</p><p className="mt-1 text-3xl font-semibold">${active.quotedPrice.toFixed(2)}</p>{active.quoteNotes && <p className="mt-2 text-sm text-white/45">{active.quoteNotes}</p>}{active.status === "quoted" && <button onClick={accept} className="mt-3 rounded-full bg-[#6EAEC6] px-5 py-2 text-sm font-semibold text-[#0B1822]">Accept quote</button>}{active.status === "accepted" && <div className="mt-3 flex flex-wrap items-center gap-3"><span className="text-sm font-semibold text-emerald-300">Quote accepted.</span><a href={`/contact?quote=${encodeURIComponent(active.id)}`} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Book this quote</a></div>}{active.status === "booked" && <p className="mt-3 text-sm font-semibold text-emerald-300">Booking request submitted. This quote is now locked.</p>}</div>}
                  {active.status === "closed" && <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/55">This conversation has been closed by Car Dash. You can still read the history, but new messages are disabled.</div>}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto py-5">{active.messages.map((message) => { if (message.sender === "system") return null; return <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 ${message.sender === "customer" ? "ml-auto bg-white/10" : "bg-[#6EAEC6] text-[#0B1822]"}`}><p className="text-sm leading-6">{message.body}</p>{message.attachmentsJson && <div className="mt-3 grid grid-cols-2 gap-2">{JSON.parse(message.attachmentsJson).map((src:string,index:number)=><img key={index} src={src} alt="Customer upload" className="max-h-48 w-full rounded-xl object-cover" />)}</div>}</div>; })}<div ref={end} /></div>
                {readOnly ? <div className="border-t border-white/10 pt-4 text-sm text-white/38">{active.status === "booked" ? "This quote has been booked. Manage the appointment from your dashboard." : "This chat is closed and read-only."}</div> : <form onSubmit={send} className="border-t border-white/10 pt-4"><div className="flex gap-2"><input className={input} value={reply} onChange={(e)=>setReply(e.target.value)} placeholder="Message Car Dash…" /><button className="rounded-full bg-[#6EAEC6] px-5 font-semibold text-[#0B1822]">Send</button></div><label className="mt-3 inline-block cursor-pointer text-xs text-white/45">Attach up to 3 photos<input type="file" accept="image/*" multiple onChange={files} className="hidden" /></label>{photos.length>0&&<span className="ml-3 text-xs text-[#6EAEC6]">{photos.length} photo(s) ready</span>}</form>}
                {error && <p className="mt-3 text-sm text-[#6EAEC6]">{error}</p>}
              </div>
            ) : (
              <form onSubmit={create} className="mx-auto max-w-2xl py-4">
                <h2 className="text-2xl font-semibold">Tell us about your vehicle</h2>
                <p className="mt-2 text-sm leading-6 text-white/45">A clean SUV may take less work than one with stains, pet hair, or heavy buildup. Photos help us price your actual vehicle instead of going only by size.</p>
                <div className="mt-5 grid gap-4">
                  <select className={input} value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)}><option value="">Select saved vehicle (optional)</option>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</option>)}</select>
                  {!vehicles.length && <a href="/vehicles" className="text-sm text-[#6EAEC6]">+ Save a vehicle first</a>}
                  <select className={input} value={serviceId} onChange={(e)=>setServiceId(e.target.value)}><option value="">Service (optional)</option>{services.map((service)=><option key={service.id} value={service.id}>{service.title}</option>)}</select>
                  <label className="block text-sm text-white/60">How dirty is it right now?<select className={`${input} mt-2`} value={condition} onChange={(e)=>setCondition(e.target.value)}><option value="">Select condition (optional)</option><option value="Light / already fairly clean">Light / already fairly clean</option><option value="Average / normal buildup">Average / normal buildup</option><option value="Heavy / needs extra work">Heavy / needs extra work</option><option value="Not sure — please judge from photos">Not sure — judge from photos</option></select></label>
                  <input className={input} value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Topic" />
                  <textarea className={`${input} min-h-36`} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Tell us what you want done and anything important we should know (pet hair, stains, third row, recent cleaning, etc.)." required />
                  <label className="cursor-pointer rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">Add photos so we can quote it better (optional, up to 3)<input type="file" accept="image/*" multiple onChange={files} className="hidden" /></label>
                  {photos.length>0&&<p className="text-sm text-[#6EAEC6]">{photos.length} photo(s) selected</p>}
                  <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><label className="block text-sm text-white/60">Mobile number for quote and appointment texts (optional)<input type="tel" className={`${input} mt-2`} value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="(630) 555-0123" /></label><label className="mt-4 flex items-start gap-3 text-sm text-white/60"><input type="checkbox" checked={smsConsent} onChange={(e)=>setSmsConsent(e.target.checked)} className="mt-1" /><span><strong className="font-semibold text-white">Yes, text me about my quote and appointment — no spam or promotional messages.</strong> Car Dash Detailing will only text you about your quote, scheduling, appointment updates, or other messages directly related to your service. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.</span></label><p className="mt-3 pl-6 text-xs text-white/35">See our <a href="/privacy-policy" className="text-[#6EAEC6]">Privacy Policy</a> and <a href="/terms-and-conditions" className="text-[#6EAEC6]">Terms and Conditions</a>.</p></div>
                  {error&&<p className="text-sm text-[#6EAEC6]">{error}</p>}
                  <button disabled={submitting} className="rounded-full bg-[#6EAEC6] px-6 py-3 font-semibold text-[#0B1822] disabled:opacity-50">{submitting ? "Sending…" : "Request My Exact Quote"}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
