"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
};

type Draft = {
  title: string;
  description: string;
  price: string;
};

const emptyDraft: Draft = { title: "", description: "", price: "" };

export default function OwnerServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadServices = async () => {
    try {
      const response = await fetch("/api/services", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load packages");
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const createService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!draft.title.trim() || !draft.description.trim() || !draft.price.trim()) {
      setError("Add a package name, what’s included, and a price.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          price: Number(draft.price),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Could not add package (${response.status})`);

      setDraft(emptyDraft);
      setMessage(`${data.title} was added. It is live on the Services page now.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add package");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditDraft({
      title: service.title,
      description: service.description,
      price: String(service.price),
    });
    setMessage("");
    setError("");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDraft.title,
          description: editDraft.description,
          price: Number(editDraft.price),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save changes");
      setEditingId(null);
      setMessage(`${data.title} was updated.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service: Service) => {
    if (!window.confirm(`Delete “${service.title}”? This removes it from the public Services page too.`)) return;
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete package");
      setMessage(`${service.title} was deleted.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete package");
    }
  };

  const input = "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-red-500/70";

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.16),transparent_35%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Owner Controls</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Build your own packages.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-400">
              One package = one price. Add it here and it automatically shows on the public Services page with its own Book Now button.
            </p>
          </div>
          <a href="/owner/dashboard" className="inline-flex w-fit rounded-full border border-white/15 px-5 py-3 text-sm font-bold transition hover:border-red-500/60 hover:text-red-400">
            Back to Dashboard
          </a>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <form onSubmit={createService} className="rounded-[2rem] border border-red-500/20 bg-[#111111] p-7 shadow-2xl shadow-black/20 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Create a Package</h2>
              <p className="mt-1 text-sm text-neutral-500">You control the name, description, and one final price.</p>
            </div>
            <span className="w-fit rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-red-400">Live Website</span>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_180px]">
            <label className="text-sm font-bold text-neutral-300">
              Package name
              <input className={`${input} mt-2`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Example: Premium Detail" />
            </label>
            <label className="text-sm font-bold text-neutral-300">
              Price
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-neutral-500">$</span>
                <input type="number" min="0" step="1" className={`${input} pl-8`} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="219" />
              </div>
            </label>
          </div>

          <label className="mt-4 block text-sm font-bold text-neutral-300">
            What’s included
            <textarea className={`${input} mt-2 min-h-32 resize-y`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={"Example:\nInterior vacuum and wipe down\nWheels and tire dressing\nTwo-bucket contact wash\nSpray protection"} />
          </label>

          <button type="submit" disabled={saving} className="mt-6 rounded-full bg-red-600 px-7 py-3.5 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving…" : "Add Package"}
          </button>
        </form>

        {(message || error) && (
          <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-semibold ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"}`}>
            {error || message}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Current Packages</p>
              <h2 className="mt-2 text-3xl font-black">What customers see</h2>
            </div>
            <span className="text-sm text-neutral-500">{services.length} package{services.length === 1 ? "" : "s"}</span>
          </div>

          {loading ? (
            <p className="text-neutral-400">Loading packages…</p>
          ) : services.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/15 p-10 text-center text-neutral-500">
              No packages yet. Create your first one above.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {services.map((service) => (
                <div key={service.id} className="rounded-[2rem] border border-white/10 bg-[#111111] p-7">
                  {editingId === service.id ? (
                    <div className="space-y-4">
                      <input className={input} value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                      <input type="number" min="0" className={input} value={editDraft.price} onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })} />
                      <textarea className={`${input} min-h-28`} value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} />
                      <div className="flex gap-3">
                        <button type="button" disabled={saving} onClick={() => saveEdit(service.id)} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black hover:bg-red-500 disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold hover:bg-white/5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <h3 className="text-2xl font-black">{service.title}</h3>
                          <p className="mt-2 text-3xl font-black text-red-500">${service.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(service)} className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold hover:border-red-500/50">Edit</button>
                          <button type="button" onClick={() => deleteService(service)} className="rounded-full border border-red-500/25 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10">Delete</button>
                        </div>
                      </div>
                      <p className="mt-5 whitespace-pre-line text-sm leading-7 text-neutral-400">{service.description}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
