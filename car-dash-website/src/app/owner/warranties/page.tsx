"use client";

import { useEffect, useState } from "react";

type Warranty = {
  id: string;
  coatingName: string;
  durationYears: number;
  installedAt: string;
  expiresAt: string;
  vehicle: { year: string; make: string; model: string };
  user: { name: string; email: string };
};

type Vehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string | null;
  userId: string;
  customerName: string;
  customerEmail: string;
};

const input = "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-[#FF2D2D]/50";

export default function WarrantyPage() {
  const [items, setItems] = useState<Warranty[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [coating, setCoating] = useState("Gyeon / Ceramic Coating");
  const [years, setYears] = useState("5");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const load = async () => {
    const [warrantyResponse, vehicleResponse, authResponse] = await Promise.all([
      fetch("/api/warranties", { cache: "no-store" }),
      fetch("/api/warranties/vehicles", { cache: "no-store" }),
      fetch("/api/auth/me", { cache: "no-store" }),
    ]);

    if (warrantyResponse.ok) setItems(await warrantyResponse.json());
    if (vehicleResponse.ok) setVehicles(await vehicleResponse.json());
    if (authResponse.ok) {
      const auth = await authResponse.json();
      setIsOwner(auth.user?.role === "owner");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setMsg("");
    const response = await fetch("/api/warranties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        coatingName: coating,
        durationYears: years,
        installedAt: date,
        installerNotes: notes,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setMsg(response.ok ? "Warranty saved." : payload.error || "Could not save warranty.");
    if (response.ok) {
      setNotes("");
      await load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this warranty record?")) return;
    const response = await fetch(`/api/warranties/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMsg(payload.error || "Could not delete warranty record.");
      return;
    }
    await load();
  };

  return (
    <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-[#FF2D2D]">{isOwner ? "Owner" : "Staff"}</p>
            <h1 className="mt-2 text-4xl font-semibold">Ceramic warranty records</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Create and manage coating warranty records for customer vehicles without requiring Quote Chat access.</p>
          </div>
          <a href={isOwner ? "/owner/dashboard" : "/admin/dashboard"} className="h-fit rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
        </div>

        <form onSubmit={add} className="mt-8 grid gap-4 rounded-[28px] border border-white/10 bg-white/[.03] p-6 md:grid-cols-2">
          <select className={input} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
            <option value="">Choose a customer vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.customerName} — {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ""}
              </option>
            ))}
          </select>
          <input className={input} value={coating} onChange={(event) => setCoating(event.target.value)} placeholder="Coating system" />
          <select className={input} value={years} onChange={(event) => setYears(event.target.value)}>
            <option value="2">2 years</option>
            <option value="3">3 years</option>
            <option value="5">5 years</option>
            <option value="8">8 years</option>
          </select>
          <input type="date" className={input} value={date} onChange={(event) => setDate(event.target.value)} />
          <textarea className={`${input} md:col-span-2`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Install notes / maintenance requirements" />
          <button className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D]">Create warranty record</button>
          {msg && <p className="self-center text-sm text-white/50">{msg}</p>}
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((warranty) => (
            <article key={warranty.id} className="rounded-[26px] border border-white/10 bg-white/[.025] p-6">
              <p className="text-xs uppercase tracking-[.22em] text-[#FF2D2D]">{warranty.durationYears}-year protection</p>
              <h2 className="mt-2 text-2xl font-semibold">{warranty.coatingName}</h2>
              <p className="mt-2 text-white/45">{warranty.vehicle.year} {warranty.vehicle.make} {warranty.vehicle.model}</p>
              <p className="mt-1 text-sm text-white/35">{warranty.user.name} · expires {new Date(warranty.expiresAt).toLocaleDateString()}</p>
              <button onClick={() => remove(warranty.id)} className="mt-4 text-sm text-red-300">Delete record</button>
            </article>
          ))}
          {!items.length && <p className="rounded-[26px] border border-dashed border-white/10 p-6 text-sm text-white/35">No ceramic warranty records yet.</p>}
        </div>
      </div>
    </main>
  );
}
