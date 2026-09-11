"use client";

import { FormEvent, useEffect, useState } from "react";

type Admin = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admins", { cache: "no-store" });
    if (response.status === 403) {
      window.location.assign("/owner/dashboard");
      return;
    }
    const data = await response.json().catch(() => []);
    if (response.ok) setAdmins(data);
    else setMessage(data.error || "Could not load admin accounts.");
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const createAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Could not create admin account.");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setMessage("Admin account created successfully.");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteAdmin = async (admin: Admin) => {
    const confirmed = window.confirm(
      `Delete admin account ${admin.email}? They will immediately lose staff access.`
    );
    if (!confirmed) return;

    setMessage("");
    const response = await fetch("/api/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin.id }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(data.message || data.error || "Done");
    if (response.ok) await load();
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-red-400">Owner only</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Admin accounts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Create staff logins that can manage support and bookings only. Admins cannot edit website text, services, reviews, pictures, gallery content, owner settings, or other admin accounts.
            </p>
          </div>
          <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/65 hover:text-white">Back to dashboard</a>
        </div>

        <div className="grid gap-6 py-8 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-[24px] border border-white/10 bg-white/[.025] p-6">
            <h2 className="text-2xl font-semibold">Create admin</h2>
            <form onSubmit={createAdmin} className="mt-5 space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin name (optional)" className="support-input" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" className="support-input" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="support-input" minLength={8} required />
              <button disabled={saving} className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-50">
                {saving ? "Creating…" : "Create admin account"}
              </button>
            </form>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[.025] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Current admins</h2>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">{admins.length}</span>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="text-sm text-white/40">Loading admins…</p>
              ) : admins.length ? (
                admins.map((admin) => (
                  <div key={admin.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/25 p-4">
                    <div>
                      <p className="font-semibold">{admin.name}</p>
                      <p className="mt-1 text-sm text-white/45">{admin.email}</p>
                      <p className="mt-1 text-[11px] text-white/25">Created {new Date(admin.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => deleteAdmin(admin)} className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20">
                      Delete admin
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/8 p-5 text-sm text-white/40">No admin accounts yet.</p>
              )}
            </div>
          </section>
        </div>

        {message && <p className="rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-white/65">{message}</p>}
      </div>
    </main>
  );
}
