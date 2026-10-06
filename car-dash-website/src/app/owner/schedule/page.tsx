"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";

type Booking = {
  id: string;
  serviceName?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  quotedPrice?: number | null;
  status?: string;
};

type ViewMode = "week" | "month";

type TaskDraft = {
  id?: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  notes: string;
  type: "todo" | "plan";
};

const EMPTY_DRAFT: TaskDraft = {
  title: "",
  date: "",
  time: "",
  endTime: "",
  notes: "",
  type: "todo",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function dateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(12, 0, 0, 0);
  return next;
}

function startOfMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  return startOfWeek(first);
}

function monthTitle(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function weekTitle(start: Date) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const left = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const right = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${left} – ${right}`;
}

function prettyTime(value?: string | null) {
  const normalized = normalizeBookingTime(value);
  if (!normalized) return value || "Time TBD";
  const [hourText, minute] = normalized.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function eventSortTime(value?: string | null) {
  return normalizeBookingTime(value) || "99:99";
}

function newId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameDate(a: Date, b: Date) {
  return isoDate(a) === isoDate(b);
}

function bookingVehicle(booking: Booking) {
  return [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(" ");
}

export default function OwnerSchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<OwnerScheduleTask[]>([]);
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [message, setMessage] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);

  useEffect(() => {
    (async () => {
      try {
        const [bookingsResponse, scheduleResponse] = await Promise.all([
          fetch("/api/bookings", { cache: "no-store" }),
          fetch("/api/owner-schedule", { cache: "no-store" }),
        ]);
        if (!bookingsResponse.ok) throw new Error("Could not load bookings.");
        if (!scheduleResponse.ok) throw new Error("Could not load your planner.");

        const bookingData = await bookingsResponse.json();
        const scheduleData = await scheduleResponse.json();
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setTasks(Array.isArray(scheduleData?.tasks) ? scheduleData.tasks : []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load schedule.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(12, 0, 0, 0);
    return value;
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => String(booking.status || "").toLowerCase() !== "cancelled" && booking.preferredDate),
    [bookings]
  );

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const monthGridStart = useMemo(() => startOfMonthGrid(cursor), [cursor]);
  const monthDays = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index)), [monthGridStart]);

  const currentRangeDates = useMemo(() => {
    if (view === "week") return new Set(weekDays.map(isoDate));
    return new Set(monthDays.map(isoDate));
  }, [view, weekDays, monthDays]);

  const currentBookings = useMemo(
    () => activeBookings.filter((booking) => booking.preferredDate && currentRangeDates.has(booking.preferredDate)),
    [activeBookings, currentRangeDates]
  );

  const currentTasks = useMemo(
    () => tasks.filter((task) => currentRangeDates.has(task.date)),
    [tasks, currentRangeDates]
  );

  const weekStats = useMemo(() => {
    const dates = new Set(weekDays.map(isoDate));
    const weekBookings = activeBookings.filter((booking) => booking.preferredDate && dates.has(booking.preferredDate));
    const weekTasks = tasks.filter((task) => dates.has(task.date));
    return {
      bookings: weekBookings.length,
      todos: weekTasks.filter((task) => task.type === "todo" && !task.completed).length,
      plans: weekTasks.filter((task) => task.type === "plan").length,
      revenue: weekBookings.reduce((sum, booking) => sum + Number(booking.quotedPrice || 0), 0),
    };
  }, [activeBookings, tasks, weekDays]);

  function itemsForDate(date: string) {
    const dayBookings = currentBookings
      .filter((booking) => booking.preferredDate === date)
      .sort((a, b) => eventSortTime(a.preferredTime).localeCompare(eventSortTime(b.preferredTime)));
    const dayTasks = currentTasks
      .filter((task) => task.date === date)
      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    return { dayBookings, dayTasks };
  }

  function moveRange(direction: number) {
    if (view === "week") setCursor((current) => addDays(current, direction * 7));
    else setCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1, 12));
  }

  function goToday() {
    const value = new Date();
    value.setHours(12, 0, 0, 0);
    setCursor(value);
  }

  function openNewTask(date = isoDate(cursor), type: "todo" | "plan" = "todo") {
    setDraft({ ...EMPTY_DRAFT, date, type });
    setEditorOpen(true);
    setMessage("");
  }

  function openEditTask(task: OwnerScheduleTask) {
    setDraft({
      id: task.id,
      title: task.title,
      date: task.date,
      time: task.time,
      endTime: task.endTime,
      notes: task.notes,
      type: task.type,
    });
    setEditorOpen(true);
    setMessage("");
  }

  async function persistTasks(nextTasks: OwnerScheduleTask[], successMessage?: string) {
    setSavingTask(true);
    setMessage("");
    try {
      const response = await fetch("/api/owner-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, tasks: nextTasks }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save planner.");
      setTasks(Array.isArray(data.tasks) ? data.tasks : nextTasks);
      if (successMessage) setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save planner.");
      return false;
    } finally {
      setSavingTask(false);
    }
  }

  async function saveDraft(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date) {
      setMessage("Add a title and date first.");
      return;
    }

    const now = new Date().toISOString();
    const existing = tasks.find((task) => task.id === draft.id);
    const task: OwnerScheduleTask = {
      id: draft.id || newId(),
      title: draft.title.trim(),
      date: draft.date,
      time: draft.time,
      endTime: draft.endTime,
      notes: draft.notes.trim(),
      completed: existing?.completed || false,
      type: draft.type,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = existing
      ? tasks.map((item) => item.id === task.id ? task : item)
      : [...tasks, task];

    const saved = await persistTasks(next, existing ? "Plan updated." : "Added to your schedule.");
    if (saved) {
      setEditorOpen(false);
      setDraft(EMPTY_DRAFT);
    }
  }

  async function toggleTask(task: OwnerScheduleTask) {
    const next = tasks.map((item) =>
      item.id === task.id
        ? { ...item, completed: !item.completed, updatedAt: new Date().toISOString() }
        : item
    );
    setTasks(next);
    await persistTasks(next);
  }

  async function deleteTask(task: OwnerScheduleTask) {
    if (!window.confirm(`Delete “${task.title}” from your schedule?`)) return;
    const next = tasks.filter((item) => item.id !== task.id);
    setTasks(next);
    await persistTasks(next, "Schedule item deleted.");
  }

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center text-sm text-black/40">Loading calendar…</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 border-b border-black/[.08] pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/36">Weekly planning + customer bookings</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#111] sm:text-4xl">Schedule</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/48">Your real bookings appear automatically. Add private to-dos and plans around them so you can see the whole week in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/owner/bookings" className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/60 hover:border-black/20 hover:text-black">Manage bookings</a>
            <a href="/owner/booking-settings" className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/60 hover:border-black/20 hover:text-black">Availability</a>
            <button onClick={() => openNewTask(isoDate(today), "todo")} className="rounded-md bg-[#111] px-4 py-2.5 text-sm font-semibold text-white">+ Add to schedule</button>
          </div>
        </div>

        {message && <div className="mt-5 rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-black/60">{message}</div>}

        <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-black/[.08] bg-black/[.08] sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Bookings this week", String(weekStats.bookings), "Active appointments"],
            ["Open to-dos", String(weekStats.todos), "Not completed yet"],
            ["Plans this week", String(weekStats.plans), "Private schedule items"],
            ["Booked value", weekStats.revenue ? money.format(weekStats.revenue) : "—", "Based on quoted booking totals"],
          ].map(([label, value, note]) => (
            <div key={label} className="bg-white px-5 py-5">
              <p className="text-xs font-medium text-black/42">{label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#111]">{value}</p>
              <p className="mt-1 text-xs text-black/34">{note}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-black/[.08] bg-white">
          <div className="flex flex-col gap-4 border-b border-black/[.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2">
              <button onClick={() => moveRange(-1)} aria-label="Previous period" className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-lg text-black/55 hover:border-black/20 hover:text-black">‹</button>
              <button onClick={goToday} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-black/55 hover:border-black/20 hover:text-black">Today</button>
              <button onClick={() => moveRange(1)} aria-label="Next period" className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-lg text-black/55 hover:border-black/20 hover:text-black">›</button>
              <h3 className="ml-2 text-base font-semibold tracking-[-.02em] text-[#111] sm:text-lg">{view === "week" ? weekTitle(weekStart) : monthTitle(cursor)}</h3>
            </div>
            <div className="flex rounded-md border border-black/10 bg-[#f5f4f1] p-1">
              <button onClick={() => setView("week")} className={`rounded px-3 py-1.5 text-xs font-semibold ${view === "week" ? "bg-white text-black shadow-sm" : "text-black/42"}`}>Week</button>
              <button onClick={() => setView("month")} className={`rounded px-3 py-1.5 text-xs font-semibold ${view === "month" ? "bg-white text-black shadow-sm" : "text-black/42"}`}>Month</button>
            </div>
          </div>

          {view === "week" ? (
            <div className="grid md:grid-cols-7">
              {weekDays.map((day, index) => {
                const date = isoDate(day);
                const { dayBookings, dayTasks } = itemsForDate(date);
                const isToday = sameDate(day, today);
                return (
                  <div key={date} className={`min-w-0 border-black/[.07] md:min-h-[530px] ${index ? "border-t md:border-l md:border-t-0" : ""}`}>
                    <div className={`flex items-center justify-between border-b border-black/[.07] px-3 py-3 ${isToday ? "bg-[#111] text-white" : "bg-[#fafafa]"}`}>
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-[.13em] ${isToday ? "text-white/45" : "text-black/35"}`}>{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
                        <p className="mt-1 text-xl font-semibold">{day.getDate()}</p>
                      </div>
                      <button onClick={() => openNewTask(date)} className={`grid h-8 w-8 place-items-center rounded-md border text-lg ${isToday ? "border-white/15 text-white/65 hover:bg-white/10" : "border-black/10 text-black/40 hover:border-black/20 hover:text-black"}`} aria-label={`Add item on ${date}`}>+</button>
                    </div>

                    <div className="space-y-2 p-2.5">
                      {dayBookings.map((booking) => (
                        <a key={booking.id} href="/owner/bookings" className="block rounded-md bg-[#111] p-3 text-white hover:bg-black">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-white/62">{prettyTime(booking.preferredTime)}</p>
                            <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-white/30">{booking.status || "booking"}</span>
                          </div>
                          <p className="mt-2 truncate text-sm font-semibold">{booking.customerName || "Customer"}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/48">{booking.serviceName || "Detailing"}</p>
                          {bookingVehicle(booking) && <p className="mt-2 truncate text-[10px] text-white/34">{bookingVehicle(booking)}</p>}
                          {Number(booking.quotedPrice || 0) > 0 && <p className="mt-2 text-xs font-semibold text-white/72">{money.format(Number(booking.quotedPrice))}</p>}
                        </a>
                      ))}

                      {dayTasks.map((task) => (
                        <div key={task.id} className={`rounded-md border p-3 ${task.completed ? "border-black/[.06] bg-[#f7f7f5] opacity-55" : task.type === "plan" ? "border-black/15 bg-[#f2eee8]" : "border-black/[.08] bg-white"}`}>
                          <div className="flex items-start gap-2">
                            {task.type === "todo" ? (
                              <input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} className="mt-0.5 h-4 w-4 shrink-0" />
                            ) : (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black/35" />
                            )}
                            <button onClick={() => openEditTask(task)} className="min-w-0 flex-1 text-left">
                              <p className={`text-[10px] font-semibold uppercase tracking-[.08em] text-black/35 ${task.completed ? "line-through" : ""}`}>{task.time ? prettyTime(task.time) : task.type === "plan" ? "Plan" : "To-do"}{task.endTime ? ` – ${prettyTime(task.endTime)}` : ""}</p>
                              <p className={`mt-1 break-words text-sm font-semibold text-[#111] ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                              {task.notes && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-black/38">{task.notes}</p>}
                            </button>
                          </div>
                        </div>
                      ))}

                      {!dayBookings.length && !dayTasks.length && (
                        <button onClick={() => openNewTask(date)} className="w-full rounded-md border border-dashed border-black/10 px-2 py-5 text-center text-[11px] text-black/25 hover:border-black/20 hover:text-black/45">Nothing planned</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-7 border-b border-black/[.07] bg-[#fafafa] md:grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <div key={label} className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[.12em] text-black/32">{label}</div>)}
              </div>
              <div className="grid md:grid-cols-7">
                {monthDays.map((day, index) => {
                  const date = isoDate(day);
                  const { dayBookings, dayTasks } = itemsForDate(date);
                  const currentMonth = day.getMonth() === cursor.getMonth();
                  const isToday = sameDate(day, today);
                  const visibleEvents = [
                    ...dayBookings.map((booking) => ({ id: `b-${booking.id}`, label: `${prettyTime(booking.preferredTime)} · ${booking.customerName || "Booking"}`, booking: true })),
                    ...dayTasks.map((task) => ({ id: `t-${task.id}`, label: `${task.time ? prettyTime(task.time) + " · " : ""}${task.title}`, booking: false })),
                  ].slice(0, 3);

                  return (
                    <div key={date} className={`min-h-[150px] border-black/[.07] p-2.5 ${index % 7 ? "md:border-l" : ""} ${index >= 7 ? "border-t" : ""} ${currentMonth ? "bg-white" : "bg-[#fafafa] text-black/35"}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <button onClick={() => openNewTask(date)} className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-[#111] text-white" : "text-black/45 hover:bg-black/[.05]"}`}>{day.getDate()}</button>
                        {(dayBookings.length + dayTasks.length) > 0 && <span className="text-[9px] text-black/25">{dayBookings.length + dayTasks.length}</span>}
                      </div>
                      <div className="space-y-1.5">
                        {visibleEvents.map((event) => (
                          <div key={event.id} className={`truncate rounded px-2 py-1.5 text-[10px] font-medium ${event.booking ? "bg-[#111] text-white" : "border border-black/[.07] bg-[#f5f4f1] text-black/58"}`}>{event.label}</div>
                        ))}
                        {(dayBookings.length + dayTasks.length) > 3 && <button onClick={() => { setCursor(day); setView("week"); }} className="px-1 text-[9px] font-semibold text-black/35 hover:text-black">+ {dayBookings.length + dayTasks.length - 3} more</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-black/40">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#111]" /> Customer booking</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-black/15 bg-white" /> To-do</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#f2eee8]" /> Personal/business plan</span>
          <span>Private schedule items never appear to customers.</span>
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit schedule item" : "Add schedule item"}>
          <button aria-label="Close schedule editor" onClick={() => setEditorOpen(false)} className="absolute inset-0 cursor-default" />
          <form onSubmit={saveDraft} className="relative z-10 w-full max-w-xl rounded-lg border border-black/10 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-black/[.08] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">{draft.id ? "Edit schedule item" : "Add to schedule"}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-.03em]">{draft.type === "todo" ? "To-do" : "Plan"}</h3>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-lg text-black/45">×</button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, type: "todo" }))} className={`rounded-md border px-4 py-3 text-sm font-semibold ${draft.type === "todo" ? "border-[#111] bg-[#111] text-white" : "border-black/10 text-black/55"}`}>To-do</button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, type: "plan" }))} className={`rounded-md border px-4 py-3 text-sm font-semibold ${draft.type === "plan" ? "border-[#111] bg-[#111] text-white" : "border-black/10 text-black/55"}`}>Plan / event</button>
              </div>

              <label className="text-xs font-medium text-black/45">Title
                <input autoFocus value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder={draft.type === "todo" ? "Wash towels, order chemicals…" : "Class, supply run, personal plans…"} className="mt-2 w-full rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-base text-black outline-none focus:border-black/30" required />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-black/45">Date
                  <input type="date" value={draft.date} onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))} className="mt-2 w-full rounded-md border border-black/10 bg-[#fafafa] px-3 py-3 text-base text-black outline-none focus:border-black/30" required />
                </label>
                <label className="text-xs font-medium text-black/45">Start time
                  <input type="time" value={draft.time} onChange={(e) => setDraft((current) => ({ ...current, time: e.target.value }))} className="mt-2 w-full rounded-md border border-black/10 bg-[#fafafa] px-3 py-3 text-base text-black outline-none focus:border-black/30" />
                </label>
                <label className="text-xs font-medium text-black/45">End time
                  <input type="time" value={draft.endTime} onChange={(e) => setDraft((current) => ({ ...current, endTime: e.target.value }))} className="mt-2 w-full rounded-md border border-black/10 bg-[#fafafa] px-3 py-3 text-base text-black outline-none focus:border-black/30" />
                </label>
              </div>

              <label className="text-xs font-medium text-black/45">Notes
                <textarea value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Optional details…" className="mt-2 min-h-24 w-full rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-base text-black outline-none focus:border-black/30" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/[.08] pt-4">
              <div>
                {draft.id && (
                  <button type="button" disabled={savingTask} onClick={() => {
                    const task = tasks.find((item) => item.id === draft.id);
                    if (task) {
                      setEditorOpen(false);
                      deleteTask(task);
                    }
                  }} className="rounded-md border border-black/10 px-4 py-2.5 text-sm font-medium text-black/45 hover:border-black/20 hover:text-black disabled:opacity-50">Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditorOpen(false)} className="rounded-md border border-black/10 px-4 py-2.5 text-sm font-medium text-black/50">Cancel</button>
                <button type="submit" disabled={savingTask} className="rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savingTask ? "Saving…" : draft.id ? "Save changes" : "Add to schedule"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
