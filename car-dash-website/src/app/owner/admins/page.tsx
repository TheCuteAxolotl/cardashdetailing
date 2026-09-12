"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PermissionDef = { key: string; label: string; description: string };
type CustomRole = { id: string; name: string; description: string | null; permissions: string[]; assignedCount: number; createdAt: string };
type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  protected: boolean;
  createdAt: string;
  updatedAt: string;
  counts: { bookings: number; vehicles: number; quoteThreads: number; warranties: number };
  phone: string | null;
  latestBooking: null | { id: string; customerPhone: string; serviceName: string; vehicleYear: string; vehicleMake: string; vehicleModel: string; status: string; preferredDate: string | null; quotedPrice: number | null; createdAt: string };
  recentBookings: { id: string; customerPhone: string; serviceName: string; vehicleYear: string; vehicleMake: string; vehicleModel: string; status: string; preferredDate: string | null; quotedPrice: number | null; createdAt: string }[];
  vehicles: { id: string; nickname: string | null; year: string; make: string; model: string; trim: string | null; vehicleType: string; color: string | null; createdAt: string }[];
  customRoles: { id: string; name: string }[];
  overrides: Record<string, "allow" | "deny">;
  effectivePermissions: string[];
  staffAccess: boolean;
};

const input = "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF2D2D]/60";

const ROLE_TEMPLATES = [
  { name: "Detailer", description: "Booking operations, customer arrival updates, and day-of-service messaging.", permissions: ["staffGuide", "bookings", "smsInbox"] },
  { name: "Support Agent", description: "Customer support and text-message assistance without pricing or website access.", permissions: ["staffGuide", "support", "smsInbox"] },
  { name: "Quote Specialist", description: "Review quote requests, customer photos, and send exact quotes.", permissions: ["staffGuide", "quoteChats", "smsInbox"] },
  { name: "Manager", description: "Operational access across bookings, support, phone, warranties, quotes, and analytics.", permissions: ["staffGuide", "bookings", "smsInbox", "quoteChats", "support", "businessPhone", "warranties", "analytics"] },
  { name: "Content Manager", description: "Maintain services, website content, media, package pricing, and discounts.", permissions: ["staffGuide", "services", "gallery", "website", "pricing"] },
] as const;

export default function StaffAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [tab, setTab] = useState<"accounts" | "roles">("accounts");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editPassword, setEditPassword] = useState("");
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [editOverrides, setEditOverrides] = useState<Record<string, "inherit" | "allow" | "deny">>({});

  const [roleId, setRoleId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const load = async () => {
    const [accountsResponse, rolesResponse] = await Promise.all([
      fetch("/api/owner/accounts", { cache: "no-store" }),
      fetch("/api/owner/roles", { cache: "no-store" }),
    ]);

    if (accountsResponse.status === 401 || accountsResponse.status === 403) {
      window.location.assign("/owner/dashboard");
      return;
    }

    const accountPayload = await accountsResponse.json().catch(() => ({}));
    const rolePayload = await rolesResponse.json().catch(() => ({}));

    if (!accountsResponse.ok) throw new Error(accountPayload.error || "Could not load accounts.");
    if (!rolesResponse.ok) throw new Error(rolePayload.error || "Could not load roles.");

    setAccounts(accountPayload.accounts || []);
    setRoles(rolePayload.roles || []);
    setCatalog(rolePayload.permissionCatalog || []);
    if (!selectedId && accountPayload.accounts?.[0]) setSelectedId(accountPayload.accounts[0].id);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load staff access."))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => accounts.find((account) => account.id === selectedId) || null, [accounts, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setEditName(selected.name);
    setEditEmail(selected.email);
    setEditRole(selected.role === "owner" ? "owner" : selected.role === "admin" ? "admin" : "user");
    setEditPassword("");
    setEditRoleIds(selected.customRoles.map((role) => role.id));
    setEditOverrides(Object.fromEntries(catalog.map((permission) => [permission.key, selected.overrides[permission.key] || "inherit"])) as Record<string, "inherit" | "allow" | "deny">);
    setMessage("");
  }, [selected?.id, catalog]);

  const visibleAccounts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter((account) => [account.name, account.email, account.phone || "", account.role, ...account.customRoles.map((role) => role.name)].join(" ").toLowerCase().includes(needle));
  }, [accounts, query]);

  const counts = useMemo(() => ({
    total: accounts.length,
    admins: accounts.filter((account) => account.role === "admin").length,
    customStaff: accounts.filter((account) => account.role !== "owner" && account.staffAccess && account.role !== "admin").length,
    customers: accounts.filter((account) => account.role === "user" && !account.staffAccess).length,
  }), [accounts]);

  const saveAccount = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/owner/accounts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          newPassword: editPassword || undefined,
          customRoleIds: editRoleIds,
          overrides: editOverrides,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save account.");
      setMessage("Account, roles, and dashboard access updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save account.");
    } finally {
      setSaving(false);
    }
  };


  const removeAllStaffAccess = async () => {
    if (!selected || selected.protected || !selected.staffAccess) return;
    const okay = window.confirm(`Remove all staff access from ${selected.name}? Their account will remain, but they will return to the normal customer dashboard.`);
    if (!okay) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/owner/accounts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", customRoleIds: [], overrides: {} }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not remove staff access.");
      setMessage("All staff access removed. This account is now a standard customer account.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove staff access.");
    } finally {
      setSaving(false);
    }
  };
  const deleteAccount = async () => {
    if (!selected || selected.protected) return;
    const okay = window.confirm(`Permanently delete ${selected.name} (${selected.email})? Their account-linked bookings, vehicles, quote chats, and warranties may also be deleted. This cannot be undone.`);
    if (!okay) return;
    const response = await fetch(`/api/owner/accounts/${selected.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.message || payload.error || "Done");
    if (response.ok) {
      setSelectedId("");
      await load();
    }
  };

  const createAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAdminName, email: newAdminEmail, password: newAdminPassword }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(payload.error || "Could not create admin account.");
    setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword("");
    setMessage("Admin account created. You can now customize its dashboard access.");
    await load();
    if (payload.admin?.id) setSelectedId(payload.admin.id);
  };

  const chooseRole = (role: CustomRole | null) => {
    setRoleId(role?.id || "");
    setRoleName(role?.name || "");
    setRoleDescription(role?.description || "");
    setRolePermissions(role?.permissions || []);
    setMessage("");
  };

  const saveRole = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(roleId ? `/api/owner/roles/${roleId}` : "/api/owner/roles", {
        method: roleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, description: roleDescription, permissions: rolePermissions }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save custom role.");
      const successMessage = roleId ? "Custom role updated." : "Custom role created.";
      chooseRole(null);
      setMessage(successMessage);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save custom role.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: CustomRole) => {
    const okay = window.confirm(`Delete the custom role “${role.name}”? It will be unassigned from ${role.assignedCount} account${role.assignedCount === 1 ? "" : "s"}.`);
    if (!okay) return;
    const response = await fetch(`/api/owner/roles/${role.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      if (roleId === role.id) chooseRole(null);
      setMessage(payload.message || "Custom role removed.");
      await load();
    } else {
      setMessage(payload.error || "Could not delete custom role.");
    }
  };

  if (loading) return <main className="min-h-screen bg-[#080808] text-white grid place-items-center">Loading accounts…</main>;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-9 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Owner only · Access control</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Staff & Accounts</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">View every account, promote or remove Admin access, create custom staff roles, assign dashboard permissions, contact customers, edit account information, or remove accounts.</p>
          </div>
          <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/65 hover:text-white">Back to dashboard</a>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setTab("accounts")} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === "accounts" ? "bg-white text-black" : "border border-white/10 text-white/55"}`}>Accounts</button>
          <button onClick={() => setTab("roles")} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === "roles" ? "bg-white text-black" : "border border-white/10 text-white/55"}`}>Custom Roles</button>
        </div>

        {message && <p className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-white/65">{message}</p>}

        {tab === "accounts" ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[["All accounts", counts.total], ["Admins", counts.admins], ["Custom-role staff", counts.customStaff], ["Customers", counts.customers]].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/35">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[380px_1fr]">
              <aside className="rounded-[26px] border border-white/10 bg-white/[.025] p-4">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, role…" className={input} />
                <div className="mt-4 max-h-[900px] space-y-2 overflow-y-auto pr-1">
                  {visibleAccounts.map((account) => (
                    <button key={account.id} onClick={() => setSelectedId(account.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === account.id ? "border-white/40 bg-white text-black" : "border-white/[.07] bg-black/20 hover:border-white/20"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className={`mt-1 truncate text-xs ${selectedId === account.id ? "text-black/50" : "text-white/35"}`}>{account.email}</p></div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${selectedId === account.id ? "bg-black/8 text-black/55" : account.role === "owner" ? "bg-[#FF2D2D]/15 text-[#FF2D2D]" : account.role === "admin" ? "bg-sky-400/10 text-sky-200" : account.staffAccess ? "bg-violet-400/10 text-violet-200" : "bg-white/5 text-white/35"}`}>{account.role === "user" && account.staffAccess ? "staff" : account.role}</span>
                      </div>
                      {account.customRoles.length > 0 && <p className={`mt-2 text-[10px] ${selectedId === account.id ? "text-black/45" : "text-white/30"}`}>{account.customRoles.map((role) => role.name).join(" · ")}</p>}
                    </button>
                  ))}
                </div>
              </aside>

              <section className="rounded-[26px] border border-white/10 bg-white/[.025] p-5 sm:p-7">
                {selected ? (
                  <div className="space-y-7">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Account details</p>
                        <h2 className="mt-2 text-3xl font-semibold">{selected.name}</h2>
                        <p className="mt-1 text-sm text-white/35">Created {new Date(selected.createdAt).toLocaleDateString()} · Updated {new Date(selected.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={`mailto:${selected.email}`} className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/65 hover:text-white">Email</a>
                        {selected.latestBooking && <a href={`/booking-chat/${selected.latestBooking.id}`} className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/65 hover:text-white">Message via Car Dash</a>}
                        {selected.phone && <a href="/owner/calls" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/65 hover:text-white">Business Phone</a>}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[["Bookings", selected.counts.bookings], ["Vehicles", selected.counts.vehicles], ["Quote chats", selected.counts.quoteThreads], ["Warranties", selected.counts.warranties]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><p className="text-xs text-white/30">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}
                    </div>

                    {selected.latestBooking && (
                      <div className="rounded-2xl border border-white/[.07] bg-black/20 p-4 text-sm text-white/55">
                        <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/30">Latest booking/contact</p>
                        <p className="mt-2">{selected.latestBooking.vehicleYear} {selected.latestBooking.vehicleMake} {selected.latestBooking.vehicleModel} · {selected.latestBooking.serviceName} · {selected.latestBooking.status}</p>
                        <p className="mt-1 text-white/35">{selected.latestBooking.customerPhone}</p>
                      </div>
                    )}

                    {(selected.vehicles.length > 0 || selected.recentBookings.length > 0) && (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/[.07] bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/30">Saved vehicles</p>
                          <div className="mt-3 space-y-2">
                            {selected.vehicles.length ? selected.vehicles.map((vehicle) => (
                              <div key={vehicle.id} className="rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2.5">
                                <p className="text-sm font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ""}</p>
                                <p className="mt-1 text-[11px] text-white/30">{[vehicle.nickname, vehicle.vehicleType, vehicle.color].filter(Boolean).join(" · ")}</p>
                              </div>
                            )) : <p className="text-xs text-white/30">No saved vehicles.</p>}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/[.07] bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/30">Recent bookings</p>
                          <div className="mt-3 space-y-2">
                            {selected.recentBookings.length ? selected.recentBookings.map((booking) => (
                              <a key={booking.id} href={`/booking-chat/${booking.id}`} className="block rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2.5 transition hover:border-white/15">
                                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{booking.serviceName}</p><span className="text-[10px] uppercase text-white/30">{booking.status}</span></div>
                                <p className="mt-1 text-[11px] text-white/30">{booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}{booking.quotedPrice != null ? ` · $${booking.quotedPrice}` : ""}</p>
                              </a>
                            )) : <p className="text-xs text-white/30">No bookings yet.</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-white/30">Name</span><input className={input} value={editName} onChange={(event) => setEditName(event.target.value)} disabled={selected.protected && false} /></label>
                      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-white/30">Email</span><input type="email" className={input} value={editEmail} onChange={(event) => setEditEmail(event.target.value)} disabled={selected.protected} /></label>
                      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-white/30">Base account role</span><select className={input} value={editRole} onChange={(event) => setEditRole(event.target.value)} disabled={selected.protected}><option value="user">Customer / standard account</option><option value="admin">Admin</option>{selected.protected && <option value="owner">Owner</option>}</select><span className="mt-2 block text-[11px] leading-5 text-white/25">Admin starts with Staff Guide, Bookings, SMS Inbox, Quote Chats, and Support. Individual access can still be denied below.</span></label>
                      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-white/30">Reset password</span><input type="password" minLength={8} className={input} value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="Leave blank to keep current password" disabled={selected.protected} /></label>
                    </div>

                    {!selected.protected && (
                      <>
                        <div>
                          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/30">Custom roles</p><h3 className="mt-2 text-xl font-semibold">Assigned roles</h3></div><button type="button" onClick={() => setTab("roles")} className="text-xs font-semibold text-[#FF2D2D]">Manage roles</button></div>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {roles.map((role) => (
                              <label key={role.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[.08] bg-black/20 p-4"><input type="checkbox" className="mt-1" checked={editRoleIds.includes(role.id)} onChange={(event) => setEditRoleIds((current) => event.target.checked ? [...current, role.id] : current.filter((id) => id !== role.id))} /><span><span className="block text-sm font-semibold">{role.name}</span><span className="mt-1 block text-xs leading-5 text-white/30">{role.description || `${role.permissions.length} dashboard permission${role.permissions.length === 1 ? "" : "s"}`}</span></span></label>
                            ))}
                            {!roles.length && <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/30">No custom roles yet.</p>}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/30">Dashboard access</p>
                          <h3 className="mt-2 text-xl font-semibold">Per-account permissions</h3>
                          <p className="mt-2 text-sm leading-6 text-white/35">Inherit uses the Admin role and custom roles. Allow grants access directly. Deny removes access even when a role normally grants it.</p>
                          <div className="mt-4 space-y-2">
                            {catalog.map((permission) => {
                              const effective = selected.effectivePermissions.includes(permission.key);
                              return <div key={permission.key} className="grid gap-3 rounded-2xl border border-white/[.07] bg-black/20 p-4 sm:grid-cols-[1fr_150px] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{permission.label}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${effective ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-white/30"}`}>{effective ? "Has access" : "No access"}</span></div><p className="mt-1 text-xs leading-5 text-white/30">{permission.description}</p></div><select className="rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs outline-none" value={editOverrides[permission.key] || "inherit"} onChange={(event) => setEditOverrides((current) => ({ ...current, [permission.key]: event.target.value as "inherit" | "allow" | "deny" }))}><option value="inherit">Inherit</option><option value="allow">Allow</option><option value="deny">Deny</option></select></div>;
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6">
                      <button onClick={saveAccount} disabled={saving} className="rounded-full bg-[#FF2D2D] px-6 py-3 text-sm font-bold text-[#0D0D0D] disabled:opacity-50">{saving ? "Saving…" : "Save account & access"}</button>
                      {!selected.protected && (
                        <div className="flex flex-wrap gap-2">
                          {selected.staffAccess && <button onClick={removeAllStaffAccess} disabled={saving} className="rounded-full border border-amber-400/25 bg-amber-400/[.06] px-5 py-3 text-sm font-semibold text-amber-200 disabled:opacity-50">Remove all staff access</button>}
                          <button onClick={deleteAccount} className="rounded-full border border-red-500/25 bg-red-500/[.06] px-5 py-3 text-sm font-semibold text-red-300">Delete account</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : <div className="grid min-h-[500px] place-items-center text-sm text-white/30">Choose an account.</div>}
              </section>
            </div>

            <form onSubmit={createAdmin} className="mt-6 rounded-[26px] border border-white/10 bg-white/[.025] p-6">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/30">Quick create</p>
              <h2 className="mt-2 text-2xl font-semibold">Create a new Admin login</h2>
              <p className="mt-2 text-sm text-white/35">You can customize the new Admin’s access immediately after creating it.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-4"><input className={input} value={newAdminName} onChange={(event) => setNewAdminName(event.target.value)} placeholder="Name" /><input className={input} type="email" value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} placeholder="Email" required /><input className={input} type="password" minLength={8} value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} placeholder="Password (8+ characters)" required /><button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black">Create Admin</button></div>
            </form>
          </>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-[380px_1fr]">
            <aside className="rounded-[26px] border border-white/10 bg-white/[.025] p-4">
              <button onClick={() => chooseRole(null)} className="w-full rounded-2xl border border-dashed border-[#FF2D2D]/30 bg-[#FF2D2D]/[.05] p-4 text-left text-sm font-semibold text-[#FF2D2D]">+ Create custom role</button>
              <div className="mt-3 space-y-2">{roles.map((role) => <button key={role.id} onClick={() => chooseRole(role)} className={`w-full rounded-2xl border p-4 text-left ${roleId === role.id ? "border-white/40 bg-white text-black" : "border-white/[.07] bg-black/20"}`}><div className="flex justify-between gap-3"><span className="font-semibold">{role.name}</span><span className={`text-[10px] ${roleId === role.id ? "text-black/40" : "text-white/30"}`}>{role.assignedCount} assigned</span></div><p className={`mt-1 text-xs ${roleId === role.id ? "text-black/45" : "text-white/30"}`}>{role.permissions.length} permissions</p></button>)}</div>
            </aside>

            <form onSubmit={saveRole} className="rounded-[26px] border border-white/10 bg-white/[.025] p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#FF2D2D]">{roleId ? "Edit custom role" : "New custom role"}</p>
              <h2 className="mt-2 text-3xl font-semibold">{roleId ? roleName || "Custom role" : "Build a role"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/35">Roles are reusable permission bundles. Assign a role to any account, then use per-account Deny/Allow overrides when that person needs an exception.</p>
              {!roleId && (
                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/25">Start from a template</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ROLE_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => {
                          setRoleName(template.name);
                          setRoleDescription(template.description);
                          setRolePermissions([...template.permissions]);
                        }}
                        className="rounded-full border border-white/10 bg-white/[.025] px-3.5 py-2 text-xs font-semibold text-white/55 transition hover:border-[#FF2D2D]/35 hover:text-white"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-xs uppercase tracking-[.15em] text-white/30">Role name</span><input className={input} value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Example: Detailer, Support Agent, Manager" required /></label><label><span className="mb-2 block text-xs uppercase tracking-[.15em] text-white/30">Description</span><input className={input} value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} placeholder="What this role is for" /></label></div>
              <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/30">Role permissions</p><div className="mt-4 grid gap-3 md:grid-cols-2">{catalog.map((permission) => <label key={permission.key} className={`cursor-pointer rounded-2xl border p-4 transition ${rolePermissions.includes(permission.key) ? "border-[#FF2D2D]/35 bg-[#FF2D2D]/[.06]" : "border-white/[.07] bg-black/20"}`}><div className="flex gap-3"><input type="checkbox" className="mt-1" checked={rolePermissions.includes(permission.key)} onChange={(event) => setRolePermissions((current) => event.target.checked ? [...current, permission.key] : current.filter((key) => key !== permission.key))} /><div><p className="text-sm font-semibold">{permission.label}</p><p className="mt-1 text-xs leading-5 text-white/30">{permission.description}</p></div></div></label>)}</div></div>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6"><button disabled={saving} className="rounded-full bg-[#FF2D2D] px-6 py-3 text-sm font-bold text-[#0D0D0D] disabled:opacity-50">{saving ? "Saving…" : roleId ? "Save role" : "Create role"}</button>{roleId && (() => { const current = roles.find((role) => role.id === roleId); return current ? <button type="button" onClick={() => deleteRole(current)} className="rounded-full border border-red-500/25 bg-red-500/[.06] px-5 py-3 text-sm font-semibold text-red-300">Delete role</button> : null; })()}</div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
