"use client";

import CalendarSubscription from "@/components/CalendarSubscription";
import OwnerCalendarBoard from "@/components/OwnerCalendarBoard";
import BookingDetailsEditor, { type EditableBooking } from "@/components/BookingDetailsEditor";
import { useEffect, useMemo, useState } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";

type Booking = EditableBooking;

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
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState(() => isoDate(new Date()));
  const [cursor, setCursor] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [message, setMessage] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
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

  const periodStats = useMemo(() => {
    const visible = view === "week"
      ? new Set(weekDays.map(isoDate))
      : new Set(monthDays.filter(day => day.getMonth() === cursor.getMonth()).map(isoDate));
    const periodBookings = activeBookings.filter(booking => booking.preferredDate && visible.has(booking.preferredDate));
    const periodTasks = tasks.filter(task => visible.has(task.date));
    return {
      bookings: periodBookings.length,
      todos: periodTasks.filter(task => task.type === "todo" && !task.completed).length,
      plans: periodTasks.filter(task => task.type === "plan").length,
      revenue: periodBookings.reduce((total, booking) => total + Number(booking.quotedPrice || 0), 0),
    };
  }, [view, weekDays, monthDays, cursor, activeBookings, tasks]);

  function moveRange(direction: number) {
    const next = view === "week"
      ? addDays(cursor, direction * 7)
      : new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1, 12);
    setCursor(next);
    setSelectedDay(isoDate(next));
  }

  function goToday() {
    const value = new Date();
    value.setHours(12, 0, 0, 0);
    setCursor(value);
    setSelectedDay(isoDate(value));
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
    return (
      <div className="grid min-h-[70vh] place-items-center bg-[#101010] text-sm text-[#c9c1b5]">
        Opening your calendar…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] px-3 py-5 text-[#f4efe5] sm:px-6 sm:py-7 xl:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d6b779]">Car Dash / Business calendar</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#f4efe5] sm:text-4xl">Your schedule.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b9b5ad]">
              All your detailing appointments, private plans, and to-dos in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/owner/bookings" className="rounded-xl border border-white/15 bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#f4efe5] hover:border-[#d6b779]/40">Bookings</a>
            <a href="/owner/booking-settings" className="rounded-xl border border-white/15 bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#f4efe5] hover:border-[#d6b779]/40">Availability</a>
            <button type="button" onClick={() => openNewTask(selectedDay, "todo")} className="rounded-xl bg-[#d6b779] px-4 py-2.5 text-sm font-semibold text-[#101010] hover:bg-[#e5c995]">+ Add event</button>
          </div>
        </header>

        {message && <p role="status" className="mt-4 rounded-xl border border-[#d6b779]/30 bg-[#29251c] px-4 py-3 text-sm text-[#f4dfae]">{message}</p>}

        <section className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4" aria-label="This week's calendar summary">
          {[
            ["Bookings", String(periodStats.bookings), view === "month" ? "This month" : "This week"],
            ["To-dos", String(periodStats.todos), "Still open"],
            ["Plans", String(periodStats.plans), view === "month" ? "This month" : "This week"],
            ["Booked value", periodStats.revenue ? money.format(periodStats.revenue) : "—", "Quoted totals"],
          ].map(([label, value, caption]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-[#1c1c1c] px-4 py-4 sm:px-5">
              <p className="text-[11px] font-medium text-[#b9b5ad]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#f4efe5] sm:text-3xl">{value}</p>
              <p className="mt-1 text-[11px] text-[#928d84]">{caption}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-[20px] border border-white/15 bg-[#1c1c1c] shadow-[0_22px_70px_rgba(0,0,0,.24)]" aria-label="Business calendar">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-[#202020] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => moveRange(-1)} aria-label="Previous week or month" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-xl text-[#f4efe5] hover:border-[#d6b779]/50">‹</button>
              <button type="button" onClick={goToday} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-[#d6b779] hover:border-[#d6b779]/50">Today</button>
              <button type="button" onClick={() => moveRange(1)} aria-label="Next week or month" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-xl text-[#f4efe5] hover:border-[#d6b779]/50">›</button>
              <h2 className="ml-1 font-serif text-xl text-[#f4efe5] sm:ml-3 sm:text-2xl">{view === "week" ? weekTitle(weekStart) : monthTitle(cursor)}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex rounded-xl border border-white/15 bg-[#161616] p-1" role="group" aria-label="Calendar view">
                <button type="button" aria-pressed={view === "month"} onClick={() => { setView("month"); setSelectedDay(isoDate(cursor)); }} className={"rounded-lg px-4 py-2 text-xs font-semibold transition " + (view === "month" ? "bg-[#d6b779] text-[#101010]" : "text-[#c7c1b6] hover:bg-white/10")}>Month</button>
                <button type="button" aria-pressed={view === "week"} onClick={() => { setView("week"); setSelectedDay(isoDate(cursor)); }} className={"rounded-lg px-4 py-2 text-xs font-semibold transition " + (view === "week" ? "bg-[#d6b779] text-[#101010]" : "text-[#c7c1b6] hover:bg-white/10")}>Week</button>
              </div>
            </div>
          </div>

          <OwnerCalendarBoard
            view={view}
            cursor={cursor}
            days={view === "month" ? monthDays : weekDays}
            today={today}
            selectedDay={selectedDay}
            bookings={currentBookings}
            tasks={currentTasks}
            onSelectDay={(date) => setSelectedDay(date)}
            onEditBooking={(booking) => setEditingBooking(booking)}
            onAddTask={(date) => openNewTask(date)}
            onEditTask={openEditTask}
            onToggleTask={toggleTask}
          />
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-1 text-xs text-[#b9b5ad]">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#214335] ring-1 ring-[#396958]" /> Confirmed</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#4c3924] ring-1 ring-[#86673b]" /> Pending</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#243c52] ring-1 ring-[#3b5d78]" /> Completed</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#36324c] ring-1 ring-[#555177]" /> Plans</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#253b46] ring-1 ring-[#526a75]" /> To-dos</span>
          <p className="w-full text-[11px] text-[#8f8980]">Private tasks aren't visible to customers. Swipe the month grid sideways on smaller screens.</p>
        </div>

        <details className="mt-6 rounded-xl border border-white/10 bg-[#1b1b1b]">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[#f4efe5]">Connect to Apple Calendar <span className="ml-2 text-xs font-normal text-[#b9b5ad]">(optional)</span></summary>
          <div className="border-t border-white/10 px-4 pb-4">
            <CalendarSubscription />
          </div>
        </details>
      </div>

      {editingBooking && (
        <BookingDetailsEditor
          key={editingBooking.id}
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSaved={async () => {
            const response = await fetch("/api/bookings", { cache: "no-store" });
            if (!response.ok) throw new Error("Booking was saved, but the calendar could not refresh. Reload to see your changes.");
            const refreshed = await response.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);
            setMessage("Booking and service address updated.");
          }}
        />
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit schedule item" : "Add schedule item"}>
          <button aria-label="Close schedule editor" onClick={() => setEditorOpen(false)} className="absolute inset-0 cursor-default" />
          <form onSubmit={saveDraft} className="relative z-10 w-full max-w-xl rounded-2xl border border-white/15 bg-[#1c1c1c] p-5 text-[#f4efe5] shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#b9b5ad]">{draft.id ? "Edit schedule item" : "Add to schedule"}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-.03em]">{draft.type === "todo" ? "To-do" : "Plan"}</h3>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-lg text-[#c2bbb0]">×</button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, type: "todo" }))} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${draft.type === "todo" ? "border-[#111] bg-[#d6b779] text-[#101010]" : "border-white/15 text-[#c2bbb0]"}`}>To-do</button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, type: "plan" }))} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${draft.type === "plan" ? "border-[#111] bg-[#d6b779] text-[#101010]" : "border-white/15 text-[#c2bbb0]"}`}>Plan / event</button>
              </div>

              <label className="text-xs font-medium text-[#c2bbb0]">Title
                <input autoFocus value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder={draft.type === "todo" ? "Wash towels, order chemicals…" : "Class, supply run, personal plans…"} className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3.5 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30" required />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-[#c2bbb0]">Date
                  <input type="date" value={draft.date} onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30" required />
                </label>
                <label className="text-xs font-medium text-[#c2bbb0]">Start time
                  <input type="time" value={draft.time} onChange={(e) => setDraft((current) => ({ ...current, time: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30" />
                </label>
                <label className="text-xs font-medium text-[#c2bbb0]">End time
                  <input type="time" value={draft.endTime} onChange={(e) => setDraft((current) => ({ ...current, endTime: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30" />
                </label>
              </div>

              <label className="text-xs font-medium text-[#c2bbb0]">Notes
                <textarea value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Optional details…" className="mt-2 min-h-24 w-full rounded-xl border border-white/15 bg-[#242424] px-3.5 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                {draft.id && (
                  <button type="button" disabled={savingTask} onClick={() => {
                    const task = tasks.find((item) => item.id === draft.id);
                    if (task) {
                      setEditorOpen(false);
                      deleteTask(task);
                    }
                  }} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[#c2bbb0] hover:border-[#d6b779]/50 hover:text-[#f4efe5] disabled:opacity-50">Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditorOpen(false)} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[#c2bbb0]">Cancel</button>
                <button type="submit" disabled={savingTask} className="rounded-xl bg-[#d6b779] px-5 py-2.5 text-sm font-semibold text-[#101010] disabled:opacity-50">{savingTask ? "Saving…" : draft.id ? "Save changes" : "Add to schedule"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
