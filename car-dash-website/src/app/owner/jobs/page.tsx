"use client";
import { useEffect, useState } from "react";
import {
  JOB_CHECKS,
  PHOTO_AREAS,
  isEditable,
  missingEvidence,
  type JobData,
  type JobState,
} from "@/lib/job-workflow";
import MessagePhotoGallery from "@/components/MessagePhotoGallery";

type Booking = {
  id: string;
  customerName: string;
  serviceName: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  address: string;
};
type Job = {
  id: string;
  assigneeId: string;
  assigneeName: string;
  assigneeActive: boolean;
  missingPhotos: string[];
  state: JobState;
  version: number;
  data: JobData;
  updatedAt: string;
};
type Employee = { id: string; name: string; email: string; role: string };
type Photo = {
  id: string;
  phase: string;
  area: string;
  createdAt: string;
  uploadedBy: string;
};
type Payload = {
  owner: boolean;
  employeeId: string;
  employees: Employee[];
  jobs: Job[];
  bookings: Booking[];
  asOf: string;
};
const names: Record<JobState, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  awaiting_review: "Awaiting review",
  needs_touch_up: "Needs touch-up",
  approved: "Approved",
};
const field =
  "w-full min-w-0 rounded-xl border border-white/20 bg-[#101010] p-3 text-base text-white focus:border-[#d6b779] outline-none";
const button =
  "rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-white/10";
const primary =
  "rounded-xl bg-[#d6b779] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40";
const panel = "rounded-2xl border border-white/15 bg-[#1b1b1a] p-4 sm:p-6";
async function request(url: string, init?: RequestInit) {
  const r = await fetch(url, { cache: "no-store", ...init });
  const p = await r.json();
  if (!r.ok) throw new Error(p.error || "Request failed.");
  return p;
}
function json(method: string, body: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
function vehicle(b: Booking) {
  return [b.vehicleYear, b.vehicleMake, b.vehicleModel, b.vehicleTrim]
    .filter(Boolean)
    .join(" ");
}
function stamp(s: string) {
  return new Date(s).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
async function compress(file: File): Promise<string> {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a photo under 25 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new Error(
        "This image format cannot be read. Choose a JPEG, PNG, or WebP photo.",
      );
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length < 1300000) return result;
    }
    throw new Error("Photo is too large. Choose a smaller image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export default function JobsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [damage, setDamage] = useState("");
  const [work, setWork] = useState("");
  const [checks, setChecks] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [assignee, setAssignee] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dirty, setDirty] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [areas, setAreas] = useState<string[]>(["Other / service detail"]);
  const [phase, setPhase] = useState("before");
  const [area, setArea] = useState<string>("Other / service detail");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
  });
  const job = data?.jobs.find((j) => j.id === selected);
  const booking = data?.bookings.find((b) => b.id === selected);
  const owner = data?.owner || false;
  async function load() {
    const p: Payload = await request("/api/jobs");
    setData(p);
    setReloadKey((k) => k + 1);
    return p;
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!job) {
      setPhotos(null);
      return;
    }
    setDamage(job.data.damageNotes);
    setWork(job.data.workNotes);
    setChecks(job.data.checks);
    setAssignee(job.assigneeId);
    setInstructions(job.data.instructions);
    setFeedback("");
    setDirty(false);
    setArea(job.data.requiredAreas[0]);
    setPhase(job.state === "assigned" ? "before" : "after");
    setPhotos(null);
    setPhotoError("");
    let alive = true;
    request(`/api/jobs/${encodeURIComponent(job.id)}/photos`)
      .then((p) => {
        if (alive) setPhotos(p.photos);
      })
      .catch((e) => {
        if (alive) setPhotoError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [job?.id, job?.version, reloadKey]);
  async function perform(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  function choose(id: string) {
    if (
      dirty &&
      !window.confirm("Discard unsaved notes and checklist changes?")
    )
      return;
    setSelected(id);
    setError("");
    setNotice("");
  }
  function act(action: string) {
    if (!job) return;
    return perform(
      () =>
        request(
          "/api/jobs",
          json("PATCH", {
            id: job.id,
            version: job.version,
            action,
            damageNotes: damage,
            workNotes: work,
            checks,
            feedback,
            assigneeId: assignee,
            instructions,
          }),
        ),
      action === "save"
        ? "Notes and checklist saved."
        : "Job updated. Booking status was not changed.",
    );
  }
  const assignable =
    data?.bookings.filter(
      (b) => b.status === "confirmed" && !data.jobs.some((j) => j.id === b.id),
    ) || [];
  const shown = (data?.jobs || [])
    .filter(
      (j) =>
        filter === "all" ||
        (filter === "active" ? j.state !== "approved" : j.state === filter),
    )
    .filter((j) => {
      const b = data?.bookings.find((b) => b.id === j.id);
      return `${j.assigneeName} ${b?.customerName} ${b ? vehicle(b) : ""} ${b?.serviceName}`
        .toLowerCase()
        .includes(query.toLowerCase());
    })
    .sort(
      (a, b) =>
        Number(b.state === "awaiting_review") -
        Number(a.state === "awaiting_review"),
    );
  const editable =
    job &&
    isEditable(job.state) &&
    ["confirmed", "completed"].includes(booking?.status || "");
  const missing =
    job && photos ? missingEvidence(job.data.requiredAreas, photos) : [];
  return (
    <div className="min-h-screen bg-[#111110] p-4 text-[#f4efe5] sm:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#d6b779]">
              Car Dash operations
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {owner ? "Jobs & Quality" : "My assigned jobs"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              {owner
                ? "Assign the car. Review the evidence. Approve the work."
                : "Your vehicles, work instructions, and private before / after photos."}
            </p>
          </div>
          <button
            disabled={busy}
            className={button}
            onClick={() => {
              if (
                dirty &&
                !window.confirm("Discard unsaved changes and refresh?")
              )
                return;
              void perform(async () => {}, "Refreshed.");
            }}
          >
            Refresh
          </button>
        </header>
        <p className="text-xs text-white/60">
          Appointment times are recorded in America/Chicago.{" "}
          {data ? `Updated ${stamp(data.asOf)}.` : "Loading jobs…"} Quality
          approval does not change booking status or send customer messages.
        </p>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-950/30 p-4 text-red-200"
          >
            {error}
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl border border-[#d6b779]/40 p-4 text-[#e6cd98]"
          >
            {notice}
          </p>
        )}
        {owner && data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Unassigned", assignable.length],
                [
                  "Awaiting review",
                  data.jobs.filter((j) => j.state === "awaiting_review").length,
                ],
                [
                  "Needs touch-up",
                  data.jobs.filter((j) => j.state === "needs_touch_up").length,
                ],
                [
                  "Active jobs",
                  data.jobs.filter((j) => j.state !== "approved").length,
                ],
              ].map(([label, count]) => (
                <div key={label} className={panel}>
                  <p className="text-sm text-white/65">{label}</p>
                  <p className="mt-2 text-3xl text-[#d6b779]">{count}</p>
                </div>
              ))}
            </div>
            <details className={panel}>
              <summary className="cursor-pointer text-lg font-semibold">
                Assign a confirmed booking ({assignable.length})
              </summary>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    await request(
                      "/api/jobs",
                      json("POST", {
                        bookingId,
                        assigneeId: newAssignee,
                        instructions: newInstructions,
                        requiredAreas: areas,
                      }),
                    );
                    setSelected(bookingId);
                    setBookingId("");
                    setNewInstructions("");
                  }, "Job assigned. The employee can open it after signing in.");
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    Confirmed booking
                    <select
                      required
                      className={field}
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                    >
                      <option value="">Choose a vehicle / appointment</option>
                      {assignable.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.preferredDate || "No date"} · {b.customerName} ·{" "}
                          {vehicle(b)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    Assigned employee
                    <select
                      required
                      className={field}
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                    >
                      <option value="">Choose employee</option>
                      {data.employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} · {e.email}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  Work instructions
                  <textarea
                    className={field + " mt-2"}
                    value={newInstructions}
                    maxLength={5000}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="Services, add-ons, access instructions, and areas needing attention"
                  />
                </label>
                <fieldset>
                  <legend className="mb-2">
                    Required matching photo areas
                  </legend>
                  <p className="mb-3 text-xs text-white/60">
                    Choose areas relevant to this service. Each needs a before
                    and an after photo.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PHOTO_AREAS.map((a) => (
                      <label
                        key={a}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={areas.includes(a)}
                          onChange={(e) =>
                            setAreas(
                              e.target.checked
                                ? [...areas, a]
                                : areas.filter((v) => v !== a),
                            )
                          }
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button disabled={busy || !areas.length} className={primary}>
                  Assign job
                </button>
              </form>
            </details>
            <details className={panel}>
              <summary className="cursor-pointer font-semibold">
                Team setup
              </summary>
              <p className="mt-3 text-sm text-white/65">
                New detailer accounts receive only Assigned jobs and Staff guide
                access. Share their login details yourself. Use Staff & accounts
                to remove access or manage existing accounts; existing admin
                permissions are not changed automatically.
              </p>
              <form
                className="mt-4 grid gap-3 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    await request("/api/jobs/team", json("POST", newEmployee));
                    setNewEmployee({ name: "", email: "", password: "" });
                  }, "Employee account created with restricted detailer access. No invitation was sent.");
                }}
              >
                {(["name", "email", "password"] as const).map((key) => (
                  <label key={key} className="text-sm capitalize">
                    {key}
                    <input
                      required
                      type={key === "name" ? "text" : key}
                      autoComplete={key === "password" ? "new-password" : "off"}
                      minLength={key === "password" ? 12 : undefined}
                      maxLength={key === "password" ? 128 : 254}
                      className={field + " mt-2"}
                      value={newEmployee[key]}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          [key]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
                <button disabled={busy} className={primary}>
                  Create detailer account
                </button>
                <a className={button + " text-center"} href="/owner/admins">
                  Staff & accounts
                </a>
              </form>
            </details>
          </>
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
          <section className={panel + " space-y-3"}>
            <h3 className="font-semibold">Job board</h3>
            <input
              aria-label="Search jobs"
              className={field}
              placeholder="Search vehicle, customer, employee"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Filter jobs"
              className={field}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="active">Active jobs</option>
              <option value="all">All jobs</option>
              {Object.entries(names).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {data && !shown.length && (
              <p className="py-6 text-sm text-white/60">
                No jobs match this view.
                {!owner && " Your owner assigns confirmed appointments here."}
              </p>
            )}
            {shown.map((j) => {
              const b = data?.bookings.find((b) => b.id === j.id);
              return (
                <button
                  disabled={busy}
                  key={j.id}
                  onClick={() => choose(j.id)}
                  className={`w-full rounded-xl border p-4 text-left ${selected === j.id ? "border-[#d6b779] bg-[#d6b779]/10" : "border-white/15 hover:bg-white/5"}`}
                >
                  <p className="text-xs font-semibold text-[#d6b779]">
                    {names[j.state]}
                  </p>
                  <p className="mt-2 font-semibold">
                    {b ? vehicle(b) : "Vehicle unavailable"}
                  </p>
                  <p className="mt-1 text-sm">{b?.customerName}</p>
                  <p className="mt-2 text-xs text-white/65">
                    {b?.preferredDate || "Date missing"} ·{" "}
                    {b?.preferredTime || "Time missing"}
                  </p>
                  <p className="mt-1 text-xs text-white/65">{j.assigneeName}</p>
                  {j.missingPhotos.length > 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      {j.missingPhotos.length} required photos missing
                    </p>
                  )}
                  {!b?.address && (
                    <p className="mt-2 text-xs text-amber-300">
                      Missing service address
                    </p>
                  )}
                  {!j.assigneeActive && (
                    <p className="mt-2 text-xs text-amber-300">
                      Employee access unavailable — reassign
                    </p>
                  )}
                  {b && !["confirmed", "completed"].includes(b.status) && (
                    <p className="mt-2 text-xs text-red-300">
                      Work blocked: booking {b.status}
                    </p>
                  )}
                </button>
              );
            })}
          </section>
          {job && booking ? (
            <div className="space-y-5">
              <section className={panel}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#d6b779]">{names[job.state]}</p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {vehicle(booking)}
                    </h3>
                    <p className="mt-1 text-white/75">
                      {booking.customerName} · {booking.serviceName}
                    </p>
                  </div>
                  {owner && (
                    <a
                      className={button + " self-start"}
                      href="/owner/bookings"
                    >
                      Manage bookings
                    </a>
                  )}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/55">
                      Appointment · America/Chicago
                    </p>
                    <p className="mt-1">
                      {booking.preferredDate || "Date missing"} ·{" "}
                      {booking.preferredTime || "Time missing"}
                    </p>
                    <p className="mt-1 text-xs text-white/65">
                      Booking: {booking.status} · Employee: {job.assigneeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/55">
                      Recorded service address
                    </p>
                    <p className="mt-1">
                      {booking.address ||
                        "Missing — owner needs to add the address to the booking."}
                    </p>
                    {booking.address && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-[#d6b779] underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
                      >
                        Open directions
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-xl bg-black/25 p-4 text-sm">
                  {job.data.instructions ||
                    "No additional work instructions recorded."}
                </p>
                {job.data.feedback && (
                  <div className="mt-4 rounded-xl border border-amber-400/40 p-4">
                    <p className="font-semibold text-amber-200">
                      Owner feedback
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {job.data.feedback}
                    </p>
                  </div>
                )}
                {owner && editable && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-[#d6b779]">
                      Change employee / instructions
                    </summary>
                    <div className="mt-3 space-y-3">
                      <select
                        aria-label="Reassign employee"
                        className={field}
                        value={assignee}
                        onChange={(e) => {
                          setAssignee(e.target.value);
                          setDirty(true);
                        }}
                      >
                        {!data?.employees.some((e) => e.id === assignee) && (
                          <option value={assignee}>Unavailable employee</option>
                        )}
                        {data?.employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      <textarea
                        aria-label="Work instructions"
                        className={field}
                        value={instructions}
                        onChange={(e) => {
                          setInstructions(e.target.value);
                          setDirty(true);
                        }}
                      />
                      <button
                        disabled={busy}
                        className={button}
                        onClick={() => act("save")}
                      >
                        Save changes
                      </button>
                    </div>
                  </details>
                )}
              </section>
              <section className={panel}>
                <h3 className="text-lg font-semibold">
                  Condition & completion
                </h3>
                <p className="mt-2 text-xs text-white/60">
                  Save notes before starting or submitting. Record damage
                  observed before work, or explicitly enter “No damage
                  observed.”
                </p>
                <label className="mt-4 block text-sm">
                  Existing damage / condition
                  <textarea
                    disabled={!editable || busy}
                    className={field + " mt-2"}
                    value={damage}
                    maxLength={5000}
                    onChange={(e) => {
                      setDamage(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <label className="mt-4 block text-sm">
                  Work notes / issues
                  <textarea
                    disabled={!editable || busy}
                    className={field + " mt-2"}
                    value={work}
                    maxLength={5000}
                    onChange={(e) => {
                      setWork(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <div className="my-4 space-y-3">
                  {JOB_CHECKS.map((c) => (
                    <label key={c} className="flex items-start gap-3 text-sm">
                      <input
                        className="mt-1"
                        type="checkbox"
                        disabled={!editable || busy}
                        checked={checks.includes(c)}
                        onChange={(e) => {
                          setChecks(
                            e.target.checked
                              ? [...checks, c]
                              : checks.filter((v) => v !== c),
                          );
                          setDirty(true);
                        }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
                {editable && (
                  <button
                    className={button}
                    disabled={busy}
                    onClick={() => act("save")}
                  >
                    Save notes & checklist
                  </button>
                )}
                {dirty && (
                  <p className="mt-3 text-xs text-amber-300">
                    Unsaved changes — save the relevant section before another
                    action.
                  </p>
                )}
              </section>
              <section className={panel}>
                <h3 className="text-lg font-semibold">
                  Before & after evidence
                </h3>
                <p className="mt-2 text-xs text-white/60">
                  Private job photos. Upload times are recorded; capture time
                  and image authenticity are not independently verified. Tap
                  photos to enlarge and swipe.
                </p>
                {photoError ? (
                  <p role="alert" className="mt-4 text-red-300">
                    {photoError} Refresh to retry.
                  </p>
                ) : !photos ? (
                  <p className="mt-4 text-white/60">Loading photo records…</p>
                ) : (
                  <>
                    {job.state === "needs_touch_up" && (
                      <p className="mt-4 text-sm text-amber-200">
                        Upload at least one new after photo showing the
                        requested touch-up before resubmitting.
                      </p>
                    )}
                    {missing.length > 0 ? (
                      <p className="mt-4 text-sm text-amber-200">
                        Missing required photos: {missing.join("; ")}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-[#d6b779]">
                        Required photo pairs are uploaded. Quality still needs
                        owner review.
                      </p>
                    )}
                    {editable && (
                      <div className="my-5 space-y-3 rounded-xl border border-white/15 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm">
                            Photo phase
                            <select
                              className={field + " mt-2"}
                              value={phase}
                              onChange={(e) => setPhase(e.target.value)}
                            >
                              <option value="before">Before</option>
                              {job.state !== "assigned" && (
                                <option value="after">After</option>
                              )}
                            </select>
                          </label>
                          <label className="text-sm">
                            Area
                            <select
                              className={field + " mt-2"}
                              value={area}
                              onChange={(e) => setArea(e.target.value)}
                            >
                              {PHOTO_AREAS.map((a) => (
                                <option key={a}>{a}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="block text-sm">
                          Add photo
                          <input
                            className={field + " mt-2"}
                            disabled={busy || dirty}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file)
                                void perform(async () => {
                                  const image = await compress(file);
                                  await request(
                                    `/api/jobs/${encodeURIComponent(job.id)}/photos`,
                                    json("POST", {
                                      version: job.version,
                                      phase,
                                      area,
                                      image,
                                    }),
                                  );
                                }, "Photo saved privately to this job.");
                            }}
                          />
                        </label>
                        <p className="text-xs text-white/55">
                          One photo at a time, up to 60 per job. Photos are
                          resized to 1,600 px for upload. If HEIC is
                          unsupported, select JPEG. Existing evidence is
                          retained.
                        </p>
                      </div>
                    )}
                    {[
                      ...new Set([
                        ...job.data.requiredAreas,
                        ...photos.map((p) => p.area),
                      ]),
                    ].map((a) => (
                      <div
                        key={a}
                        className="mt-6 border-t border-white/10 pt-4"
                      >
                        <h4 className="mb-3 font-semibold">
                          {a}
                          {job.data.requiredAreas.includes(a) && (
                            <span className="ml-2 text-xs font-normal text-white/50">
                              Required pair
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {["before", "after"].map((p) => {
                            const matching = photos.filter(
                              (x) => x.area === a && x.phase === p,
                            );
                            return (
                              <div
                                key={p}
                                className="min-w-0 rounded-xl bg-black/20 p-3"
                              >
                                <p className="mb-3 text-sm font-medium capitalize">
                                  {p}
                                </p>
                                {matching.length ? (
                                  <>
                                    <MessagePhotoGallery
                                      photos={matching.map(
                                        (x) =>
                                          `/api/jobs/${encodeURIComponent(job.id)}/photos?photo=${encodeURIComponent(x.id)}`,
                                      )}
                                      altPrefix={`${a} ${p}`}
                                    />
                                    {matching.map((x) => (
                                      <p
                                        key={x.id}
                                        className="mt-2 text-[11px] text-white/55"
                                      >
                                        {x.uploadedBy} · {stamp(x.createdAt)}
                                      </p>
                                    ))}
                                  </>
                                ) : (
                                  <p className="text-sm text-amber-200">
                                    No {p} photo
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </section>
              <section className={panel}>
                <h3 className="mb-4 font-semibold">Next step</h3>
                <div className="flex flex-wrap gap-3">
                  {editable && job.state === "assigned" && (
                    <button
                      className={primary}
                      disabled={busy || dirty || !photos}
                      onClick={() => act("start")}
                    >
                      Start job
                    </button>
                  )}
                  {editable &&
                    ["in_progress", "needs_touch_up"].includes(job.state) && (
                      <button
                        className={primary}
                        disabled={
                          busy || dirty || !photos || missing.length > 0
                        }
                        onClick={() => act("submit")}
                      >
                        Submit for owner review
                      </button>
                    )}
                  {job.state === "awaiting_review" && !owner && (
                    <p className="text-sm text-white/65">
                      Submitted. Notes and photos are locked until the owner
                      reviews your work.
                    </p>
                  )}
                  {job.state === "approved" && (
                    <p className="text-sm text-[#d6b779]">
                      Work approved. Evidence is locked.
                    </p>
                  )}
                </div>
                {owner &&
                  ["awaiting_review", "approved"].includes(job.state) && (
                    <div className="mt-3 space-y-3">
                      <label className="block text-sm">
                        Review feedback
                        <textarea
                          className={field + " mt-2"}
                          value={feedback}
                          maxLength={5000}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Required when requesting touch-up or reopening"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {job.state === "awaiting_review" && (
                          <>
                            <button
                              className={primary}
                              disabled={busy || !photos}
                              onClick={() => act("approve")}
                            >
                              Approve work
                            </button>
                            <button
                              className={button}
                              disabled={busy || !feedback.trim()}
                              onClick={() => act("return")}
                            >
                              Needs touch-up
                            </button>
                          </>
                        )}
                        {job.state === "approved" && (
                          <button
                            className={button}
                            disabled={busy || !feedback.trim()}
                            onClick={() => act("reopen")}
                          >
                            Reopen for touch-up
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                {!editable &&
                  !["approved", "awaiting_review"].includes(job.state) && (
                    <p className="text-amber-200">
                      The booking must be confirmed before work can continue.
                    </p>
                  )}
              </section>
              <details className={panel}>
                <summary className="cursor-pointer font-semibold">
                  Activity history ({job.data.history.length})
                </summary>
                <ol className="mt-4 space-y-4">
                  {[...job.data.history].reverse().map((h, i) => (
                    <li
                      key={i}
                      className="border-l border-[#d6b779]/50 pl-4 text-sm"
                    >
                      <p>
                        {h.action} · {h.actor}
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        {stamp(h.at)}
                      </p>
                      {h.note && (
                        <p className="mt-2 whitespace-pre-wrap text-white/75">
                          {h.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          ) : (
            <div className={panel + " py-16 text-center text-white/60"}>
              Select a job to view the vehicle, assignment, and quality
              evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
