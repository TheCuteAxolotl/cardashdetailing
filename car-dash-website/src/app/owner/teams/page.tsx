"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Team = {
  id: string; name: string; description: string; memberIds: string[];
  createdAt: string; updatedAt: string;
};
type Detailer = {id: string; name: string; email: string; effectivePermissions: string[]; role: string};
const input = "mt-2 w-full rounded-xl border border-white/15 bg-[#292724] px-4 py-3 text-sm text-white outline-none focus:border-[#d6b779]";

export default function DetailerTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [detailers, setDetailers] = useState<Detailer[]>([]);
  const [version, setVersion] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const eligible = useMemo(() => detailers.filter(account =>
    account.role !== "owner" && account.effectivePermissions.includes("assignedJobs")), [detailers]);

  async function load() {
    setLoading(true); setError("");
    try {
      const [t, a] = await Promise.all([
        fetch("/api/owner/teams", {cache:"no-store"}),
        fetch("/api/owner/accounts", {cache:"no-store"}),
      ]);
      const teamsData = await t.json().catch(() => ({}));
      const accountData = await a.json().catch(() => ({}));
      if (!t.ok || !a.ok) throw Error(teamsData.error || accountData.error || "Could not load teams.");
      setTeams(Array.isArray(teamsData.teams) ? teamsData.teams : []);
      setVersion(teamsData.version || null);
      setDetailers(Array.isArray(accountData.accounts) ? accountData.accounts : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load teams.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function select(team: Team | null) {
    setSelectedId(team?.id || "");
    setName(team?.name || "");
    setDescription(team?.description || "");
    setMemberIds(team?.memberIds || []);
    setMessage(""); setError("");
  }
  function toggle(id: string, checked: boolean) {
    setMemberIds(existing => checked ? [...existing.filter(x => x !== id), id] : existing.filter(x => x !== id));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/owner/teams", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({id:selectedId || undefined,name,description,memberIds,version}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not save team.");
      await load();
      const newId = data.team?.id;
      if (newId) {
        setSelectedId(newId);
        setName(data.team.name);
        setDescription(data.team.description);
        setMemberIds(data.team.memberIds);
      }
      setMessage(selectedId ? "Team updated." : "Team created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save team.");
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!selectedId || busy || !window.confirm("Delete this team? Its employees and personal supply lists will remain. The owner can restore the team from Deleted History.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/owner/teams", {
        method: "DELETE", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({id:selectedId,version}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not delete team.");
      select(null);
      await load();
      setMessage("Team archived in Deleted History.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete team."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#141413] px-4 py-7 text-[#f3ece1] sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Car Dash · Team management</p>
          <h1 className="mt-2 text-3xl font-semibold">Detailer teams</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Build a team, assign its detailers, and keep every person's supplies separate.
            Moving someone between teams does not change existing bookings or inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/owner/admins" className="rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold">Staff accounts</a>
          <a href="/owner/deleted-history" className="rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold">Deleted history</a>
        </div>
      </header>
      {message && <p role="status" className="rounded-xl border border-[#d6b779]/30 p-3 text-sm text-[#e7d1a3]">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-white/15 bg-[#211f1e] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Your teams</h2>
            <button onClick={() => select(null)} className="rounded-lg bg-[#d6b779] px-3 py-2 text-xs font-semibold text-[#181818]">New team</button>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? <p className="text-sm text-white/45">Loading…</p> :
             teams.length === 0 ? <p className="text-sm text-white/55">No teams yet. Create your first team.</p> :
             teams.map(team => <button key={team.id} onClick={() => select(team)}
               className={"w-full rounded-xl border p-4 text-left " + (selectedId === team.id ? "border-[#d6b779] bg-[#d6b779]/10" : "border-white/10 bg-black/20")}>
               <p className="text-sm font-semibold">{team.name}</p>
               <p className="mt-1 text-xs text-white/55">{team.memberIds.length} detailers</p>
               {team.description && <p className="mt-2 text-xs text-white/45">{team.description}</p>}
             </button>)}
          </div>
        </aside>
        <form onSubmit={save} className="rounded-2xl border border-white/15 bg-[#211f1e] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#d6b779]">{selectedId ? "Edit team" : "Create team"}</p>
          <h2 className="mt-1 text-xl font-semibold">{selectedId ? name || "Team" : "New detailing team"}</h2>
          <label className="mt-5 block text-xs font-semibold text-white/70">Team name
            <input className={input} required maxLength={100} value={name} onChange={event=>setName(event.target.value)}
              placeholder="e.g. South Elgin Unit 2"/>
          </label>
          <label className="mt-4 block text-xs font-semibold text-white/70">Description
            <textarea className={input} maxLength={500} rows={2} value={description} onChange={event=>setDescription(event.target.value)}
              placeholder="Camry unit · weekends · interior and exterior work"/>
          </label>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Assign detailers ({memberIds.length})</legend>
            <p className="mt-2 text-xs text-white/45">Only accounts with Assigned Jobs access appear. Each detailer can belong to one team; selecting someone here moves them from another team.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {eligible.length ? eligible.map(account => {
                const currentTeam = teams.find(team => team.id !== selectedId && team.memberIds.includes(account.id));
                return <label key={account.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <input type="checkbox" className="mt-1 accent-[#d6b779]"
                    checked={memberIds.includes(account.id)}
                    onChange={event=>toggle(account.id,event.target.checked)}/>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{account.name}</span>
                    <span className="mt-1 block break-all text-xs text-white/45">{account.email}</span>
                    {currentTeam && <span className="mt-1 block text-[11px] text-[#d6b779]">Currently in {currentTeam.name}</span>}
                  </span>
                </label>;
              }) : <p className="text-sm text-white/50">No detailers yet. Grant Assigned Jobs access in Staff & Accounts first.</p>}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button disabled={busy} type="submit" className="rounded-xl bg-[#d6b779] px-5 py-3 text-sm font-bold text-[#181818] disabled:opacity-40">
              {busy ? "Saving…" : selectedId ? "Save team" : "Create team"}</button>
            {selectedId && <button type="button" disabled={busy} onClick={() => void remove()}
              className="rounded-xl border border-red-400/25 px-4 py-3 text-xs font-semibold text-red-200 disabled:opacity-40">Delete team</button>}
          </div>
        </form>
      </div>
    </div>
  </main>;
}
