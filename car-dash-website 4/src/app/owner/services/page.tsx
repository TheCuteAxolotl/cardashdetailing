"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
const inputClass = "w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-red-500/50";

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
      const response = await fetch(`/api/services?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load packages");
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

    const price = Number(draft.price);
    if (!draft.title.trim() || !draft.description.trim() || !draft.price.trim() || !Number.isFinite(price) || price < 0) {
      setError("Add a package name, what’s included, and a valid price.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim(),
          price,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Could not add package (${response.status})`);

      setDraft(emptyDraft);
      setMessage(`Added ${data.title}. It should be live on the Services page now.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add package");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditDraft({ title: service.title, description: service.description, price: String(service.price) });
    setMessage("");
    setError("");
  };

  const saveEdit = async (id: string) => {
    const price = Number(editDraft.price);
    if (!editDraft.title.trim() || !editDraft.description.trim() || !editDraft.price.trim() || !Number.isFinite(price) || price < 0) {
      setError("Add a package name, what’s included, and a valid price.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDraft.title.trim(),
          description: editDraft.description.trim(),
          price,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Could not save package (${response.status})`);

      setEditingId(null);
      setMessage(`Saved ${data.title}.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save package");
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service: Service) => {
    if (!window.confirm(`Delete ${service.title}?`)) return;
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Could not delete package (${response.status})`);
      setMessage(`${service.title} was deleted.`);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete package");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="border-b border-white/10 bg-[#090909]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">Owner</p>
            <h1 className="mt-2 text-3xl font-black">Manage Services</h1>
            <p className="mt-2 text-sm text-neutral-500">Create the packages you actually want customers to see.</p>
          </div>
          <Link href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/5">Back</Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
          <form onSubmit={createService} className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-[#151515] to-[#0a0a0a] p-7 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">New Package</p>
            <h2 className="mt-2 text-2xl font-black">Add a service package</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">This uses one price only. Whatever you enter here is what shows on the public package card.</p>

            <div className="mt-6 space-y-4">
              <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Package name" />
              <input type="number" min="0" step="1" className={inputClass} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Price" />
              <textarea className={`${inputClass} min-h-36 resize-y`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What’s included? Put each part on a new line if you want." />
            </div>

            <button type="submit" disabled={saving} className="mt-5 w-full rounded-full bg-red-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving…" : "Add Package"}
            </button>

            {(message || error) && (
              <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-semibold ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"}`}>
                {error || message}
              </div>
            )}
          </form>

          <div className="rounded-[30px] border border-white/10 bg-[#0d0d0d] p-7 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">How it works</p>
            <h2 className="mt-2 text-2xl font-black">What you add here is what customers see.</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-400">
              <p>There are no hardcoded Basic, Premium, or Ultimate packages anymore.</p>
              <p>There are no separate drop-off, delivery, and mobile prices anymore.</p>
              <p>Each package gets one price, one description, and one Book Now button on the public Services page.</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Current Packages</p>
              <h2 className="mt-2 text-3xl font-black">Live packages</h2>
            </div>
            <span className="text-sm text-neutral-500">{services.length} package{services.length === 1 ? "" : "s"}</span>
          </div>

          {loading ? (
            <p className="text-neutral-400">Loading packages…</p>
          ) : services.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-white/15 p-10 text-center text-neutral-500">
              No packages yet. Add your first one above.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {services.map((service) => (
                <div key={service.id} className="rounded-[30px] border border-white/10 bg-[#0d0d0d] p-7">
                  {editingId === service.id ? (
                    <div className="space-y-4">
                      <input className={inputClass} value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                      <input type="number" min="0" step="1" className={inputClass} value={editDraft.price} onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })} />
                      <textarea className={`${inputClass} min-h-32`} value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} />
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
                          <p className="mt-2 text-4xl font-black text-red-500">${service.price}</p>
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
