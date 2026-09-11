"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const input = "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-[#00F2FE]/60";

export default function QuotePage() {
  const [user, setUser] = useState<any>(undefined);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [subject, setSubject] = useState("Detailing quote");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [smsConsent, setSmsConsent] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const me = await fetch("/api/auth/me", { cache: "no-store" });
    if (!me.ok) {
      setUser(null);
      return;
    }

    const md = await me.json();
    setUser(md.user);

    const [v, s, t] = await Promise.all([
      fetch("/api/vehicles", { cache: "no-store" }),
      fetch("/api/services", { cache: "no-store" }),
      fetch("/api/quotes", { cache: "no-store" }),
    ]);

    if (v.ok) setVehicles(await v.json());
    if (s.ok) setServices((await s.json()).filter((x: any) => x.active));
    if (t.ok) {
      const ts = await t.json();
      setThreads(ts);
      const q = new URLSearchParams(location.search);
      const tid = q.get("thread");
      if (tid && ts.some((x: Thread) => x.id === tid)) setSelected(tid);
      else if (!selected && ts[0]) setSelected(ts[0].id);
      const sv = q.get("service");
      if (sv) setServiceId(sv);
      const vv = q.get("vehicle");
      if (vv) setVehicleId(vv);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [selected]);

  const active = useMemo(() => threads.find((thread) => thread.id === selected) || null, [threads, selected]);
  const readOnly = Boolean(active && ["closed", "booked"].includes(active.status));

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  const files = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = [...(event.target.files || [])].slice(0, 3);
    const urls: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > 450000) {
        setError("Each photo must be under 450 KB for now.");
        continue;
      }
      urls.push(
        await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject();
          reader.readAsDataURL(file);
        })
      );
    }

    setPhotos(urls);
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, serviceId, subject, message: body, attachments: photos, smsConsent, phone }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not start chat.");
      return;
    }
    setBody("");
    setPhotos([]);
    setSmsConsent(false);
    setPhone("");
    setSelected(data.id);
    await load();
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

  if (user === undefined) return <main className="min-h-screen bg-[#0D0D0D] p-10 text-white">Loading…</main>;

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0D0D0D] px-6 py-24 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[#00F2FE]">Specialist Chat</p>
          <h1 className="mt-3 text-4xl font-semibold">Sign in to start a private quote conversation.</h1>
          <p className="mt-4 text-white/45">Your chat, photos, quotes, and history stay tied to your account.</p>
          <div className="mt-7 flex justify-center gap-3">
            <a href="/login" className="rounded-full bg-[#00F2FE] px-6 py-3 text-[#0D0D0D]">Login</a>
            <a href="/register" className="rounded-full border border-white/15 px-6 py-3">Create account</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-[#00F2FE]">Private quote chat</p>
          <h1 className="mt-2 text-4xl font-semibold">Chat to a Specialist</h1>
          <p className="mt-2 text-white/40">Send photos, ask questions, receive an exact quote, accept it, then book with that exact price.</p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[26px] border border-white/10 bg-white/[.025] p-3">
            <button onClick={() => setSelected("")} className="mb-3 w-full rounded-2xl bg-[#00F2FE] px-4 py-3 text-left font-semibold text-[#0D0D0D]">
              + New quote chat
            </button>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelected(thread.id)}
                className={`mb-2 w-full rounded-2xl p-4 text-left ${selected === thread.id ? "bg-white text-black" : "hover:bg-white/5"}`}
              >
                <p className="font-semibold">{thread.subject}</p>
                <p className={`mt-1 text-xs ${selected === thread.id ? "text-black/50" : "text-white/35"}`}>
                  {thread.status}{thread.quotedPrice ? ` · $${thread.quotedPrice.toFixed(2)}` : ""}
                </p>
              </button>
            ))}
          </aside>

          <section className="min-h-[650px] rounded-[26px] border border-white/10 bg-white/[.025] p-5">
            {active ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold">{active.subject}</h2>
                      <p className="mt-1 text-sm text-white/40">
                        {active.vehicle ? `${active.vehicle.year} ${active.vehicle.make} ${active.vehicle.model}` : "No vehicle selected"} · {active.status}
                      </p>
                    </div>
                    {active.status === "accepted" && active.quotedPrice && (
                      <a href={`/contact?quote=${encodeURIComponent(active.id)}`} className="rounded-full bg-[#00F2FE] px-5 py-2.5 text-sm font-semibold text-[#0D0D0D]">
                        Book Now · ${active.quotedPrice.toFixed(2)}
                      </a>
                    )}
                  </div>

                  {active.quotedPrice && (
                    <div className="mt-4 rounded-2xl border border-[#00F2FE]/20 bg-[#00F2FE]/[.05] p-4">
                      <p className="text-xs uppercase tracking-[.2em] text-[#00F2FE]">Car Dash Final Quote</p>
                      <p className="mt-1 text-3xl font-semibold">${active.quotedPrice.toFixed(2)}</p>
                      {active.quoteNotes && <p className="mt-2 text-sm text-white/45">{active.quoteNotes}</p>}
                      {active.status === "quoted" && (
                        <button onClick={accept} className="mt-3 rounded-full bg-[#00F2FE] px-5 py-2 text-sm font-semibold text-[#0D0D0D]">Accept quote</button>
                      )}
                      {active.status === "accepted" && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-emerald-300">Quote accepted.</span>
                          <a href={`/contact?quote=${encodeURIComponent(active.id)}`} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
                            Book this quote
                          </a>
                        </div>
                      )}
                      {active.status === "booked" && <p className="mt-3 text-sm font-semibold text-emerald-300">Booking request submitted. This quote is now locked.</p>}
                    </div>
                  )}

                  {active.status === "closed" && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/55">
                      This conversation has been closed by Car Dash. You can still read the history, but new messages are disabled.
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto py-5">
                  {active.messages.map((message) => {
                    if (message.sender === "system") return null;
                    return (
                      <div
                        key={message.id}
                        className={`max-w-[82%] rounded-2xl px-4 py-3 ${message.sender === "customer" ? "ml-auto bg-white/10" : "bg-[#00F2FE] text-[#0D0D0D]"}`}
                      >
                        <p className="text-sm leading-6">{message.body}</p>
                        {message.attachmentsJson && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {JSON.parse(message.attachmentsJson).map((src: string, index: number) => (
                              <img key={index} src={src} alt="Customer upload" className="max-h-48 w-full rounded-xl object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={end} />
                </div>

                {readOnly ? (
                  <div className="border-t border-white/10 pt-4 text-sm text-white/38">
                    {active.status === "booked" ? "This quote has been booked. Manage the appointment from your dashboard." : "This chat is closed and read-only."}
                  </div>
                ) : (
                  <form onSubmit={send} className="border-t border-white/10 pt-4">
                    <div className="flex gap-2">
                      <input className={input} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Message Car Dash…" />
                      <button className="rounded-full bg-[#00F2FE] px-5 font-semibold text-[#0D0D0D]">Send</button>
                    </div>
                    <label className="mt-3 inline-block cursor-pointer text-xs text-white/45">
                      Attach up to 3 photos
                      <input type="file" accept="image/*" multiple onChange={files} className="hidden" />
                    </label>
                    {photos.length > 0 && <span className="ml-3 text-xs text-[#67F7FF]">{photos.length} photo(s) ready</span>}
                  </form>
                )}

                {error && <p className="mt-3 text-sm text-[#67F7FF]">{error}</p>}
              </div>
            ) : (
              <form onSubmit={create} className="mx-auto max-w-2xl py-4">
                <h2 className="text-2xl font-semibold">Start a quote conversation</h2>
                <div className="mt-5 grid gap-4">
                  <select className={input} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
                    <option value="">Select saved vehicle (optional)</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </option>
                    ))}
                  </select>
                  {!vehicles.length && <a href="/vehicles" className="text-sm text-[#00F2FE]">+ Save a vehicle first</a>}

                  <select className={input} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
                    <option value="">Service (optional)</option>
                    {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                  </select>

                  <input className={input} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Topic" />
                  <textarea
                    className={`${input} min-h-36`}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Tell us what you want done, what condition the vehicle is in, and anything important we should know."
                  />

                  <label className="cursor-pointer rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">
                    Add photos (optional, up to 3)
                    <input type="file" accept="image/*" multiple onChange={files} className="hidden" />
                  </label>
                  {photos.length > 0 && <p className="text-sm text-[#67F7FF]">{photos.length} photo(s) selected</p>}

                  <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                    <label className="block text-sm text-white/60">
                      Mobile number for optional SMS updates
                      <input
                        type="tel"
                        className={input}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="(630) 555-0123"
                      />
                    </label>
                    <label className="mt-4 flex items-start gap-3 text-sm text-white/60">
                      <input type="checkbox" checked={smsConsent} onChange={(event) => setSmsConsent(event.target.checked)} className="mt-1" />
                      <span>
                        I agree to receive transactional and customer-care text messages from Car Dash Detailing about quote replies,
                        bookings, appointments, and service updates. Message frequency varies. Message and data rates may apply. Reply
                        STOP to opt out or HELP for help. Consent is not a condition of purchase.
                      </span>
                    </label>
                    <p className="mt-3 pl-6 text-xs text-white/35">
                      See our <a href="/privacy-policy" className="text-[#00F2FE]">Privacy Policy</a> and{" "}
                      <a href="/terms-and-conditions" className="text-[#00F2FE]">Terms and Conditions</a>.
                    </p>
                  </div>

                  {error && <p className="text-sm text-[#67F7FF]">{error}</p>}
                  <button className="rounded-full bg-[#00F2FE] px-6 py-3 text-[#0D0D0D] font-semibold">Start private chat</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
