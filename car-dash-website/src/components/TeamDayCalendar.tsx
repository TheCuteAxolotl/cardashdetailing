"use client";
import { useEffect, useMemo, useState } from "react";
import type { EditableBooking } from "@/components/BookingDetailsEditor";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";
import { bookingServiceAddress } from "@/lib/booking-owner-details";
import { timeMinutes } from "@/lib/booking-duration";
import {
  validCalendarDate,
  bookingInterval,
  chicagoClock,
  layoutTimeBlocks,
  minuteLabel,
  shiftCalendarDate,
} from "@/lib/team-calendar";
type TeamData = {
  employees: { id: string; name: string; email: string }[];
  jobs: {
    id: string;
    assigneeId: string;
    assigneeName: string;
    state: string;
    assigneeActive: boolean;
  }[];
};
type Props = {
  date: string;
  bookings: EditableBooking[];
  tasks: OwnerScheduleTask[];
  onEditBooking: (b: EditableBooking) => void;
  onEditTask: (t: OwnerScheduleTask) => void;
  onAddTask: (date: string, time?: string) => void;
  bookingColors: Record<string, string>;
  accentColor: string;
};
type Event = {
  id: string;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  label: string;
  booking?: EditableBooking;
  task?: OwnerScheduleTask;
  carryIn?: boolean;
  carryOut?: boolean;
};
const palettes = [
  { bg: "#24483e", border: "#6ea58d", text: "#dcf5e8" },
  { bg: "#263f55", border: "#7099bc", text: "#e0efff" },
  { bg: "#493448", border: "#b28ba8", text: "#f9e3f4" },
  { bg: "#484027", border: "#c4aa6e", text: "#fff0cb" },
];
export default function TeamDayCalendar({
  date,
  bookings,
  tasks,
  onEditBooking,
  onEditTask,
  onAddTask,
  bookingColors,
  accentColor,
}: Props) {
  const [team, setTeam] = useState<TeamData | null>(null),
    [error, setError] = useState("");
  const [hidden, setHidden] = useState<string[]>([]),
    [refresh, setRefresh] = useState(0),
    [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(() => chicagoClock());
  useEffect(() => {
    const t = setInterval(() => setClock(chicagoClock()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/jobs", { cache: "no-store" })
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error || "Could not load assignments");
        if (active) setTeam(p);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setTeam(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  const lanes = useMemo(() => {
    const people =
      team?.employees.map((e) => ({
        id: e.id,
        name: e.name,
        note: "Detailer",
      })) || [];
    for (const job of team?.jobs || [])
      if (!people.some((p) => p.id === job.assigneeId))
        people.push({
          id: job.assigneeId,
          name: job.assigneeName,
          note: "Access unavailable",
        });
    return [
      ...people.filter((p) => !hidden.includes(p.id)),
      {
        id: "unassigned",
        name: team ? "Unassigned" : "Assignment unverified",
        note: team ? "Confirmed bookings" : "Team data unavailable",
      },
      {
        id: "pending",
        name: "Awaiting confirmation",
        note: "Requests · not confirmed",
      },
      { id: "plans", name: "Your plans", note: "Private plans & to-dos" },
    ];
  }, [team, hidden]);
  const events = new Map<string, Event[]>();
  const unscheduled: EditableBooking[] = [];
  const add = (lane: string, event: Event) =>
    events.set(lane, [...(events.get(lane) || []), event]);
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const interval = bookingInterval(b, date);
    if (!interval) {
      if (
        (!validCalendarDate(b.preferredDate) || b.preferredDate === date) &&
        (!validCalendarDate(b.preferredDate) ||
          timeMinutes(b.preferredTime || "") === null)
      )
        unscheduled.push(b);
      continue;
    }
    const job = team?.jobs.find((j) => j.id === b.id);
    const lane =
      b.status !== "confirmed" && b.status !== "completed"
        ? "pending"
        : job?.assigneeId || "unassigned";
    const range = `${minuteLabel(interval.rawStart)} – ${minuteLabel(interval.rawEnd)}${interval.carryIn ? " · started yesterday" : interval.carryOut ? " · ends tomorrow" : ""}`;
    add(lane, {
      id: b.id,
      ...interval,
      title: b.customerName,
      subtitle: [b.vehicleYear, b.vehicleMake, b.vehicleModel]
        .filter(Boolean)
        .join(" "),
      label: range,
      booking: b,
    });
  }
  const anytime: OwnerScheduleTask[] = [];
  for (const t of tasks) {
    const start = timeMinutes(t.time),
      end = timeMinutes(t.endTime);
    if (start === null) {
      if (t.date === date) anytime.push(t);
      continue;
    }
    const offset =
      t.date === date
        ? 0
        : shiftCalendarDate(t.date, 1) === date
          ? -1440
          : null;
    if (offset === null) continue;
    const finish = end !== null ? (end > start ? end : end + 1440) : start + 30;
    if (finish + offset <= 0) continue;
    add("plans", {
      id: `task-${t.id}`,
      start: Math.max(0, start + offset),
      end: Math.min(1440, finish + offset),
      title: t.title,
      subtitle:
        t.type === "todo"
          ? t.completed
            ? "Completed to-do"
            : "To-do"
          : "Private plan",
      label: `${minuteLabel(start)}${end !== null ? ` – ${minuteLabel(end)}` : " · 30-min display block"}`,
      task: t,
    });
  }
  const visibleEvents = lanes.flatMap((l) => events.get(l.id) || []);
  const startHour = Math.max(
    0,
    Math.min(7, ...visibleEvents.map((e) => Math.floor(e.start / 60))),
  );
  const endHour = Math.min(
    24,
    Math.max(20, ...visibleEvents.map((e) => Math.ceil(e.end / 60))),
  );
  const mobileEvents = lanes.flatMap((lane, index) =>
    (events.get(lane.id) || []).map(event => ({
      ...event,
      laneId: lane.id,
      laneName: lane.name,
      color: event.task?.color || (event.booking ? bookingColors[event.booking.id] : "") ||
        (lane.id === "pending" ? "#b99454" : lane.id === "plans" ? "#8d7ad6" : palettes[index % palettes.length].border),
    }))
  ).sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
  const hourHeight = 64,
    height = (endHour - startHour) * hourHeight;
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );
  const gridStyle = {
    gridTemplateColumns: `56px repeat(${lanes.length},minmax(190px,1fr))`,
    minWidth: 56 + lanes.length * 190,
  };
  const conflicts = lanes
    .filter((l) => !["unassigned", "pending", "plans"].includes(l.id))
    .reduce(
      (n, l) =>
        n +
        layoutTimeBlocks(events.get(l.id) || []).filter((e) => e.conflict)
          .length,
      0,
    );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#202020] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="text-xs leading-5 text-[#c9c1b5]">
          <span className="sm:hidden">Chicago time · Team appointments</span>
          <span className="hidden sm:inline">America/Chicago · Block lengths use estimated service durations</span>
          {conflicts > 0 && (
            <span className="ml-3 text-amber-200">
              {conflicts} appointments overlap for an employee
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs font-semibold">
              {team?.employees.filter((e) => !hidden.includes(e.id)).length ||
                0}{" "}
              people ▾
            </summary>
            <div className="absolute right-0 top-11 z-40 w-64 space-y-3 rounded-xl border border-white/20 bg-[#252525] p-4 shadow-xl">
              <button
                className="text-xs text-[#d6b779]"
                onClick={() => setHidden([])}
              >
                Show everyone
              </button>
              {team?.employees.map((e) => (
                <label key={e.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={!hidden.includes(e.id)}
                    onChange={(ev) =>
                      setHidden((old) =>
                        ev.target.checked
                          ? old.filter((id) => id !== e.id)
                          : [...old, e.id],
                      )
                    }
                  />
                  {e.name}
                </label>
              ))}
              {!team?.employees.length && (
                <p className="text-xs text-white/60">
                  Add employees in Jobs & Quality, then Team setup.
                </p>
              )}
            </div>
          </details>
          <button
            disabled={loading}
            onClick={() => setRefresh((x) => x + 1)}
            className="rounded-full border border-white/20 px-3 py-2 text-xs disabled:opacity-50"
          >
            {loading ? "Loading team…" : "Refresh team"}
          </button>
          <a
            href="/owner/jobs"
            className="rounded-full bg-[#d6b779] px-3 py-2 text-xs font-semibold text-[#111]"
          >
            Assign jobs
          </a>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="border-b border-amber-400/30 bg-amber-950/30 p-4 text-sm text-amber-200"
        >
          Assignments could not be verified: {error}. Bookings are shown without
          assumed employee assignments.
        </p>
      )}
      <div className="md:hidden" aria-label="Compact mobile day calendar">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
          <div className="text-xs font-semibold text-[#e9dfd1]">
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
            {mobileEvents.length} scheduled
          </span>
        </div>
        {mobileEvents.length ? (
          <div className="divide-y divide-white/[.07]">
            {mobileEvents.map(event => (
              <div key={event.laneId + event.id} className="flex items-start gap-2.5 px-2.5 py-2.5">
                <div className="w-[58px] shrink-0 pt-1 text-right">
                  <span className="block text-[11px] font-semibold leading-4 text-[#f0e7db]">{minuteLabel(event.start)}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-white/45">{minuteLabel(event.end)}</span>
                </div>
                <button type="button"
                  onClick={() => event.booking ? onEditBooking(event.booking) : event.task && onEditTask(event.task)}
                  className="min-w-0 flex-1 rounded-lg border-l-[4px] px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-white"
                  style={{ borderLeftColor: event.color, backgroundColor: event.color + "22" }}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">{event.title}</span>
                    {event.booking?.quotedPrice != null && Number(event.booking.quotedPrice) > 0 ? (
                      <span className="shrink-0 text-[11px] font-bold text-white/85">${Number(event.booking.quotedPrice).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                    ) : event.task?.price != null ? (
                      <span className="shrink-0 text-[11px] font-bold text-white/85">${Number(event.task.price).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-white/75">{event.booking?.serviceName || event.subtitle || event.laneName}</span>
                  <span className="mt-1 block truncate text-[10px] text-white/50">{event.laneName}{event.booking?.status ? " · " + event.booking.status : ""}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-white/65">No timed events today</p>
            <button type="button" onClick={() => onAddTask(date)} style={{ color: accentColor }}
              className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold">Add an event</button>
          </div>
        )}
        <div className="border-t border-white/10 px-3 py-3">
          <button type="button" onClick={() => onAddTask(date)}
            className="w-full rounded-lg border border-dashed border-white/25 py-2.5 text-xs font-semibold"
            style={{ color: accentColor }}>+ Add to this day</button>
        </div>
      </div>
      <div
        className="hidden max-h-[75vh] overflow-auto overscroll-contain md:block"
        aria-label="Employee day calendar. Scroll vertically for hours and horizontally for employees."
      >
        <div className="relative" style={{ minWidth: gridStyle.minWidth }}>
          <div
            className="sticky top-0 z-30 grid border-b border-white/15 bg-[#202020]"
            style={gridStyle}
          >
            <div className="sticky left-0 z-40 flex items-end justify-center bg-[#202020] pb-3 text-[10px] text-white/50">
              TIME
            </div>
            {lanes.map((lane, i) => (
              <div
                key={lane.id}
                className="border-l border-white/10 px-3 py-5 text-center"
              >
                <div
                  style={{
                    background: palettes[i % 4].bg,
                    color: palettes[i % 4].text,
                  }}
                  className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border border-white/15 text-sm font-semibold"
                >
                  {lane.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <p className="text-sm font-semibold">{lane.name}</p>
                <p className="mt-1 text-[10px] text-white/50">
                  {lane.note} · {(events.get(lane.id) || []).length} items
                </p>
              </div>
            ))}
          </div>
          <div className="relative grid" style={gridStyle}>
            <div className="sticky left-0 z-20 bg-[#191919]" style={{ height }}>
              {hours.slice(0, -1).map((h) => (
                <span
                  key={h}
                  className="absolute right-2 text-[11px] text-[#bbb4a9]"
                  style={{ top: (h - startHour) * hourHeight + 4 }}
                >
                  {minuteLabel(h * 60).replace(":00", "")}
                </span>
              ))}
            </div>
            {lanes.map((lane, index) => {
              const packed = layoutTimeBlocks(events.get(lane.id) || []);
              const palette = palettes[index % 4];
              return (
                <div
                  key={lane.id}
                  className="relative border-l border-white/10"
                  style={{
                    height,
                    backgroundColor: "#191a19",
                  }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-white/10"
                      style={{ top: (h - startHour) * hourHeight }}
                    />
                  ))}
                  {hours.slice(0, -1).map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/5"
                      style={{ top: (h - startHour + 0.5) * hourHeight }}
                    />
                  ))}
                  {hours.slice(0, -1).map(hour => (
                    <button key={hour} type="button"
                      aria-label={`Add activity on ${date} at ${minuteLabel(hour * 60)}`}
                      onClick={() => onAddTask(date, String(hour).padStart(2, "0") + ":00")}
                      className="absolute inset-x-0 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset"
                      style={{top:(hour - startHour) * hourHeight, height:hourHeight}} />
                  ))}
                  {packed.map((event) => {
                    const pending = lane.id === "pending",
                      plan = lane.id === "plans";
                    const overlap =
                      event.conflict &&
                      !pending &&
                      !plan &&
                      lane.id !== "unassigned";
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() =>
                          event.booking
                            ? onEditBooking(event.booking)
                            : event.task && onEditTask(event.task)
                        }
                        title={`${event.title} · ${event.subtitle} · ${event.label}${event.booking ? ` · ${event.booking.serviceName} · ${event.booking.status}` : ""}`}
                        className="absolute overflow-auto rounded-lg border border-l-[4px] p-2.5 text-left shadow-sm transition hover:brightness-125 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-white"
                        style={{
                          top:
                            ((event.start - startHour * 60) * hourHeight) / 60 +
                            2,
                          height: Math.max(
                            20,
                            ((event.end - event.start) * hourHeight) / 60 - 4,
                          ),
                          left: `calc(${(event.column * 100) / event.columns}% + 3px)`,
                          width: `calc(${100 / event.columns}% - 6px)`,
                          background: event.task?.color
                            ? event.task.color + "38"
                            : event.booking && bookingColors[event.booking.id]
                              ? bookingColors[event.booking.id] + "38"
                              : plan ? "#353535" : pending ? "#4c3924" : palette.bg,
                          borderColor: overlap
                            ? "#ed9b65"
                            : event.task?.color || (event.booking && bookingColors[event.booking.id]) ||
                              (plan ? "#777" : pending ? "#b99454" : palette.border),
                          color: plan
                            ? "#eee"
                            : pending
                              ? "#ffe2ad"
                              : palette.text,
                        }}
                      >
                        <span className="block text-sm font-semibold leading-5">
                          {event.title}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium">
                          {event.label}
                        </span>
                        <span className="mt-2 block text-xs opacity-90">
                          {event.subtitle}
                        </span>
                        {event.booking && (
                          <>
                            <span className="mt-1 block text-xs opacity-90">
                              {event.booking.serviceName}
                            </span>
                            <span className="mt-3 inline-block rounded-full bg-black/20 px-2 py-1 text-[10px] font-semibold capitalize">
                              {event.booking.status || "Status unverified"}
                            </span>
                            <span className="ml-1 text-[10px] opacity-80">
                              Estimated finish
                            </span>
                            {!bookingServiceAddress(event.booking.notes) && (
                              <span className="mt-2 block text-[10px] font-semibold text-amber-100">
                                Service address missing
                              </span>
                            )}
                          </>
                        )}
                        {event.booking?.quotedPrice != null && Number(event.booking.quotedPrice) > 0 && <span className="mt-1 block text-xs font-bold">${Number(event.booking.quotedPrice).toLocaleString("en-US", {maximumFractionDigits:2})}</span>}
                        {event.task?.price != null && <span className="mt-1 block text-xs font-bold">${Number(event.task.price).toLocaleString("en-US", {maximumFractionDigits:2})}</span>}
                        {overlap && (
                          <span className="mt-2 block text-[10px] font-bold text-amber-100">
                            Schedule overlap
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {clock.date === date &&
              clock.minutes >= startHour * 60 &&
              clock.minutes < endHour * 60 && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-[#f37d86]"
                  style={{
                    top: ((clock.minutes - startHour * 60) * hourHeight) / 60,
                  }}
                >
                  <span className="absolute -top-3 left-1 rounded-full bg-[#f37d86] px-1.5 py-1 text-[9px] font-bold text-[#151515]">
                    {minuteLabel(clock.minutes)}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-[11px] text-white/55">
        <span>
          Gaps are not verified employee availability. Tap an appointment to edit its details.
        </span>
        <button className="text-[#d6b779]" onClick={() => onAddTask(date)}>
          + Add activity
        </button>
      </div>
      {(unscheduled.length > 0 || anytime.length > 0) && (
        <section className="border-t border-white/10 p-4">
          <h3 className="text-sm font-semibold">
            No scheduled time / all-day items
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {unscheduled.map((b) => (
              <button
                key={b.id}
                onClick={() => onEditBooking(b)}
                className="rounded-xl border border-amber-400/30 bg-amber-950/20 px-4 py-3 text-left text-xs text-amber-100"
              >
                {b.customerName} · {b.serviceName}
                <span className="mt-1 block">
                  {!validCalendarDate(b.preferredDate)
                    ? "Appointment date missing / invalid"
                    : "Appointment time missing / invalid"}
                </span>
              </button>
            ))}
            {anytime.map((t) => (
              <button
                key={t.id}
                onClick={() => onEditTask(t)}
                className="rounded-xl border border-white/20 px-4 py-3 text-xs"
              >
                {t.title} · {t.completed ? "Completed" : t.type}{t.price != null ? " · $" + Number(t.price).toLocaleString("en-US", {maximumFractionDigits:2}) : ""}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
