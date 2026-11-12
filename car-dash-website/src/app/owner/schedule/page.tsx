"use client";

import CalendarSubscription from "@/components/CalendarSubscription";
import TeamDayCalendar from "@/components/TeamDayCalendar";
import { chicagoClock } from "@/lib/team-calendar";
import OwnerCalendarBoard from "@/components/OwnerCalendarBoard";
import BookingDetailsEditor, {
  type EditableBooking,
} from "@/components/BookingDetailsEditor";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeBookingTime } from "@/lib/booking-availability";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";

type Booking = EditableBooking;

type ViewMode = "day" | "week" | "month";

type TaskDraft = {
  id?: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  notes: string;
  price: string;
  color: string;
  type: "todo" | "plan";
};

const EMPTY_DRAFT: TaskDraft = {
  title: "",
  date: "",
  time: "",
  endTime: "",
  notes: "",
  price: "",
  color: "#4f8fa9",
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
  return [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel]
    .filter(Boolean)
    .join(" ");
}

export default function OwnerSchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<OwnerScheduleTask[]>([]);
  const [bookingColors, setBookingColors] = useState<Record<string, string>>({});
  const [accentColor, setAccentColor] = useState("#d6b779");
  const [view, setView] = useState<ViewMode>("day");
  const [selectedDay, setSelectedDay] = useState(() => chicagoClock().date);
  const [cursor, setCursor] = useState(() => {
    const today = dateFromIso(chicagoClock().date);
    return today;
  });
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [message, setMessage] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [createTime, setCreateTime] = useState("");
  function chooseActivity(date: string, time = "") {
    setCreateTime(time);
    setSelectedDay(date);
    setCreateDate(date);
  }
  const chooser = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (createDate && !loading) chooser.current?.showModal();
  }, [createDate, loading]);
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
        if (!scheduleResponse.ok)
          throw new Error("Could not load your planner.");

        const bookingData = await bookingsResponse.json();
        const scheduleData = await scheduleResponse.json();
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        const loadedTasks: OwnerScheduleTask[] = Array.isArray(scheduleData?.tasks) ? scheduleData.tasks : [];
        setTasks(loadedTasks);
        setBookingColors(scheduleData?.bookingColors || {});
        setAccentColor(scheduleData?.accentColor || "#d6b779");
        const params = new URLSearchParams(window.location.search);
        const task = loadedTasks.find(item => item.id === params.get("editTask"));
        const date = task?.date || params.get("add");
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          setSelectedDay(date);
          setCursor(dateFromIso(date));
          if (task) openEditTask(task);
          else setCreateDate(date);
          window.history.replaceState(window.history.state, "", window.location.pathname);
        }
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Could not load schedule.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = useMemo(() => {
    const value = dateFromIso(chicagoClock().date);
    return value;
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          String(booking.status || "").toLowerCase() !== "cancelled" &&
          booking.preferredDate,
      ),
    [bookings],
  );

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const monthGridStart = useMemo(() => startOfMonthGrid(cursor), [cursor]);
  const monthDays = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index)),
    [monthGridStart],
  );

  const currentRangeDates = useMemo(() => {
    if (view === "day") return new Set([isoDate(cursor)]);
    if (view === "week") return new Set(weekDays.map(isoDate));
    return new Set(monthDays.map(isoDate));
  }, [view, weekDays, monthDays, cursor]);

  const currentBookings = useMemo(
    () =>
      activeBookings.filter(
        (booking) =>
          booking.preferredDate && currentRangeDates.has(booking.preferredDate),
      ),
    [activeBookings, currentRangeDates],
  );

  const currentTasks = useMemo(
    () => tasks.filter((task) => currentRangeDates.has(task.date)),
    [tasks, currentRangeDates],
  );

  const periodStats = useMemo(() => {
    const visible =
      view === "day"
        ? new Set([isoDate(cursor)])
        : view === "week"
          ? new Set(weekDays.map(isoDate))
          : new Set(
              monthDays
                .filter((day) => day.getMonth() === cursor.getMonth())
                .map(isoDate),
            );
    const periodBookings = activeBookings.filter(
      (booking) => booking.preferredDate && visible.has(booking.preferredDate),
    );
    const periodTasks = tasks.filter((task) => visible.has(task.date));
    return {
      bookings: periodBookings.length,
      todos: periodTasks.filter(
        (task) => task.type === "todo" && !task.completed,
      ).length,
      plans: periodTasks.filter((task) => task.type === "plan").length,
      revenue: periodBookings.reduce(
        (total, booking) => total + Number(booking.quotedPrice || 0),
        0,
      ),
    };
  }, [view, weekDays, monthDays, cursor, activeBookings, tasks]);

  function moveRange(direction: number) {
    const next =
      view === "day"
        ? addDays(cursor, direction)
        : view === "week"
          ? addDays(cursor, direction * 7)
          : new Date(
              cursor.getFullYear(),
              cursor.getMonth() + direction,
              1,
              12,
            );
    setCursor(next);
    setSelectedDay(isoDate(next));
  }

  function goToday() {
    const value = dateFromIso(chicagoClock().date);
    setCursor(value);
    setSelectedDay(isoDate(value));
  }

  function openNewTask(date = isoDate(cursor), type: "todo" | "plan" = "todo", time = "") {
    setDraft({ ...EMPTY_DRAFT, date, type, time, color: type === "plan" ? "#8d7ad6" : "#4f8fa9" });
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
      price: task.price == null ? "" : String(task.price),
      color: task.color || (task.type === "plan" ? "#8d7ad6" : "#4f8fa9"),
      type: task.type,
    });
    setEditorOpen(true);
    setMessage("");
  }

  async function persistTasks(
    nextTasks: OwnerScheduleTask[],
    successMessage?: string,
    preferences?: { bookingColors?: Record<string, string>; accentColor?: string },
  ) {
    setSavingTask(true);
    setMessage("");
    try {
      const response = await fetch("/api/owner-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: 1,
          tasks: nextTasks,
          bookingColors: preferences?.bookingColors ?? bookingColors,
          accentColor: preferences?.accentColor ?? accentColor,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not save planner.");
      setTasks(Array.isArray(data.tasks) ? data.tasks : nextTasks);
      if (data.bookingColors) setBookingColors(data.bookingColors);
      if (data.accentColor) setAccentColor(data.accentColor);
      if (successMessage) setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save planner.",
      );
      return false;
    } finally {
      setSavingTask(false);
    }
  }

  async function saveBookingColor(id: string, color: string) {
    const next = { ...bookingColors };
    if (color) next[id] = color;
    else delete next[id];
    await persistTasks(tasks, "Booking color updated.", { bookingColors: next });
  }

  async function saveAccentColor(color: string) {
    await persistTasks(tasks, "Calendar colors updated.", { accentColor: color });
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
      price: draft.price === "" ? null : Number(draft.price),
      color: draft.color,
      completed: existing?.completed || false,
      type: draft.type,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = existing
      ? tasks.map((item) => (item.id === task.id ? task : item))
      : [...tasks, task];

    const saved = await persistTasks(
      next,
      existing ? "Plan updated." : "Added to your schedule.",
    );
    if (saved) {
      setEditorOpen(false);
      setDraft(EMPTY_DRAFT);
    }
  }

  async function toggleTask(task: OwnerScheduleTask) {
    const next = tasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            completed: !item.completed,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    setTasks(next);
    await persistTasks(next);
  }

  async function deleteTask(task: OwnerScheduleTask) {
    if (!window.confirm(`Delete “${task.title}” from your schedule?`)) return;
    const next = tasks.filter((item) => item.id !== task.id);
    if (await persistTasks(next, "Schedule item deleted.")) setEditorOpen(false);
  }

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-[#101010] text-sm text-[#c9c1b5]">
        Opening your calendar…
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#101010] px-2 py-3 text-[#f4efe5] sm:px-6 sm:py-7 xl:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3 sm:gap-5 sm:pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d6b779]">
              Car Dash / Business calendar
            </p>
            <h1 className="mt-1 font-serif text-2xl tracking-tight text-[#f4efe5] sm:mt-2 sm:text-4xl">
              Team calendar.
            </h1>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-[#b9b5ad] sm:block">
              See who is detailing each car, when the work is scheduled, and
              where your day has gaps.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/owner/bookings"
              className="hidden rounded-xl border border-white/15 bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#f4efe5] hover:border-[#d6b779]/40 sm:inline-flex"
            >
              Bookings
            </a>
            <a
              href="/owner/booking-settings"
              className="hidden rounded-xl border border-white/15 bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#f4efe5] hover:border-[#d6b779]/40 sm:inline-flex"
            >
              Availability
            </a>
            <button
              type="button"
              onClick={() => chooseActivity(selectedDay)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-[#101010] hover:brightness-110 sm:px-4 sm:py-2.5 sm:text-sm"
              style={{ backgroundColor: accentColor }}
            >
              + Add event
            </button>
          </div>
        </header>

        {message && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-[#d6b779]/30 bg-[#29251c] px-4 py-3 text-sm text-[#f4dfae]"
          >
            {message}
          </p>
        )}

        {view !== "day" && (
          <section
            className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4"
            aria-label="Calendar summary"
          >
            {[
              [
                "Bookings",
                String(periodStats.bookings),
                view === "month" ? "This month" : "This week",
              ],
              ["To-dos", String(periodStats.todos), "Still open"],
              [
                "Plans",
                String(periodStats.plans),
                view === "month" ? "This month" : "This week",
              ],
              [
                "Booked value",
                periodStats.revenue ? money.format(periodStats.revenue) : "—",
                "Quoted totals",
              ],
            ].map(([label, value, caption]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-[#1c1c1c] px-4 py-4 sm:px-5"
              >
                <p className="text-[11px] font-medium text-[#b9b5ad]">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#f4efe5] sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-[#928d84]">{caption}</p>
              </div>
            ))}
          </section>
        )}

        <section
          className="mt-3 min-w-0 overflow-visible rounded-[16px] border border-white/15 bg-[#1c1c1c] shadow-[0_22px_70px_rgba(0,0,0,.24)] sm:mt-5 sm:rounded-[20px]"
          aria-label="Business calendar"
        >
          <div className="flex flex-col gap-2 border-b border-white/10 bg-[#202020] px-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => moveRange(-1)}
                aria-label="Previous calendar period"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 text-xl text-[#f4efe5] hover:border-[#d6b779]/50 sm:h-10 sm:w-10"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goToday}
                className="rounded-lg border border-white/15 px-2.5 py-2 text-[11px] font-semibold hover:border-white/40 sm:px-4 sm:py-2.5 sm:text-xs"
                style={{ color: accentColor }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => moveRange(1)}
                aria-label="Next calendar period"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 text-xl text-[#f4efe5] hover:border-[#d6b779]/50 sm:h-10 sm:w-10"
              >
                ›
              </button>
              <h2 className="ml-1 min-w-0 flex-1 truncate font-serif text-[15px] text-[#f4efe5] sm:ml-3 sm:flex-none sm:text-2xl">
                {view === "day"
                  ? cursor.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : view === "week"
                    ? weekTitle(weekStart)
                    : monthTitle(cursor)}
              </h2>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 sm:shrink-0 sm:justify-start">
              <input
                aria-label="Jump to date"
                type="date"
                value={isoDate(cursor)}
                onChange={(e) => {
                  if (e.target.value) {
                    setCursor(dateFromIso(e.target.value));
                    setSelectedDay(e.target.value);
                  }
                }}
                className="min-w-0 max-w-[164px] rounded-lg border border-white/20 bg-[#161616] px-2 py-2 text-xs text-[#eee] [color-scheme:dark] sm:max-w-none sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-base"
              />
              <button
                type="button"
                onClick={() => {
                  const next = addDays(cursor, 14);
                  setCursor(next);
                  setSelectedDay(isoDate(next));
                }}
                className="hidden whitespace-nowrap rounded-xl border border-white/20 px-3 py-2.5 text-xs text-[#d6b779] md:block"
              >
                +2 weeks
              </button>
              <select
                aria-label="Calendar view"
                value={view}
                onChange={(e) => {
                  setView(e.target.value as ViewMode);
                  setSelectedDay(isoDate(cursor));
                }}
                className="rounded-lg border border-white/20 bg-[#161616] px-2 py-2 text-xs text-[#eee] sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-base"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <details className="relative">
                <summary className="cursor-pointer rounded-lg border border-white/20 px-2.5 py-2 text-xs font-medium sm:px-3 sm:py-2.5">Colors</summary>
                <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-white/20 bg-[#272521] p-3 shadow-2xl">
                  <p className="mb-2 text-xs text-[#cac1b2]">Calendar accent</p>
                  <div className="flex flex-wrap gap-2">
                    {["#d6b779", "#619eea", "#7bc59d", "#b393eb", "#e58d8d"].map(color => (
                      <button type="button" key={color} aria-label={"Use calendar accent " + color}
                        onClick={() => void saveAccentColor(color)}
                        className="h-8 w-8 rounded-full border-2 border-white/20 focus-visible:outline-2 focus-visible:outline-white"
                        style={{ backgroundColor: color, outlineColor: accentColor === color ? "#fff" : undefined }} />
                    ))}
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-xs">Custom color
                    <input type="color" value={accentColor} aria-label="Custom calendar accent"
                      onChange={event => void saveAccentColor(event.target.value)} className="h-8 w-12 cursor-pointer" />
                  </label>
                  <p className="mt-2 text-[11px] leading-4 text-white/55">Edit an event to set its own color. Colors save across your devices.</p>
                </div>
              </details>
            </div>
          </div>

          {view === "day" ? (
            <TeamDayCalendar
              date={isoDate(cursor)}
              bookings={bookings}
              tasks={tasks}
              onEditBooking={setEditingBooking}
              onEditTask={openEditTask}
              onAddTask={chooseActivity}
              bookingColors={bookingColors}
              accentColor={accentColor}
            />
          ) : (
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
              onAddTask={chooseActivity}
              onEditTask={openEditTask}
              onToggleTask={toggleTask}
              bookingColors={bookingColors}
              accentColor={accentColor}
            />
          )}
        </section>

        {view !== "day" && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-1 text-xs text-[#b9b5ad]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#214335] ring-1 ring-[#396958]" />{" "}
              Confirmed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#4c3924] ring-1 ring-[#86673b]" />{" "}
              Pending
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#243c52] ring-1 ring-[#3b5d78]" />{" "}
              Completed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#36324c] ring-1 ring-[#555177]" />{" "}
              Plans
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#253b46] ring-1 ring-[#526a75]" />{" "}
              To-dos
            </span>
            <p className="w-full text-[11px] text-[#8f8980]">
              Private tasks aren't visible to customers. On phones, tap any date to see its events.
            </p>
          </div>
        )}

        <details className="mt-6 rounded-xl border border-white/10 bg-[#1b1b1b]">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[#f4efe5]">
            Connect to Apple Calendar{" "}
            <span className="ml-2 text-xs font-normal text-[#b9b5ad]">
              (optional)
            </span>
          </summary>
          <div className="border-t border-white/10 px-4 pb-4">
            <CalendarSubscription />
          </div>
        </details>
      </div>

      {createDate && <dialog ref={chooser} aria-labelledby="add-calendar-title" onClose={() => setCreateDate("")}
        className="fixed inset-0 m-auto w-[min(92vw,24rem)] rounded-2xl border border-white/20 bg-[#211f1c] p-5 text-[#f4efe5] backdrop:bg-black/70">
        <h2 id="add-calendar-title" className="text-xl font-semibold">Add to calendar</h2>
        <p className="mb-4 mt-1 text-sm">{dateFromIso(createDate).toLocaleDateString("en-US", {weekday:"long", month:"long", day:"numeric", year:"numeric"})}{createTime && " · " + prettyTime(createTime)}</p>
        <div className="grid gap-2">
          <a href={"/owner/bookings?create=1&date=" + createDate + (createTime ? "&time=" + encodeURIComponent(createTime) : "")} className="rounded-xl bg-[#d6b779] px-4 py-3 text-center font-semibold text-[#191714]">Customer booking</a>
          {(["todo","plan"] as const).map(kind => <button key={kind} type="button" className="rounded-xl border px-4 py-3" onClick={() => { openNewTask(createDate, kind, createTime); setCreateDate(""); }}>{kind === "todo" ? "Private to-do" : "Private plan"}</button>)}
          <button type="button" onClick={() => chooser.current?.close()} className="py-2">Close</button>
        </div>
      </dialog>}
      {editingBooking && (
        <BookingDetailsEditor
          key={editingBooking.id}
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          calendarColor={bookingColors[editingBooking.id] || ""}
          onCalendarColorChange={(color) => saveBookingColor(editingBooking.id, color)}
          onSaved={async () => {
            const response = await fetch("/api/bookings", {
              cache: "no-store",
            });
            if (!response.ok)
              throw new Error(
                "Booking was saved, but the calendar could not refresh. Reload to see your changes.",
              );
            const refreshed = await response.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);
            setMessage("Calendar updated.");
          }}
        />
      )}

      {editorOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={draft.id ? "Edit schedule item" : "Add schedule item"}
        >
          <button
            aria-label="Close schedule editor"
            onClick={() => setEditorOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <form
            onSubmit={saveDraft}
            className="relative z-10 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#1c1c1c] p-4 text-[#f4efe5] shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#b9b5ad]">
                  {draft.id ? "Edit schedule item" : "Add to schedule"}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-.03em]">
                  {draft.type === "todo" ? "To-do" : "Plan"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-lg text-[#c2bbb0]"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({ ...current, type: "todo", color: current.color === "#8d7ad6" ? "#4f8fa9" : current.color }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${draft.type === "todo" ? "border-[#111] bg-[#d6b779] text-[#101010]" : "border-white/15 text-[#c2bbb0]"}`}
                >
                  To-do
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({ ...current, type: "plan", color: current.color === "#4f8fa9" ? "#8d7ad6" : current.color }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${draft.type === "plan" ? "border-[#111] bg-[#d6b779] text-[#101010]" : "border-white/15 text-[#c2bbb0]"}`}
                >
                  Plan / event
                </button>
              </div>

              <label className="text-xs font-medium text-[#c2bbb0]">
                Title
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  placeholder={
                    draft.type === "todo"
                      ? "Wash towels, order chemicals…"
                      : "Class, supply run, personal plans…"
                  }
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3.5 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-[#c2bbb0]">
                  Date
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        date: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30"
                    required
                  />
                </label>
                <label className="text-xs font-medium text-[#c2bbb0]">
                  Start time
                  <input
                    type="time"
                    value={draft.time}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        time: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30"
                  />
                </label>
                <label className="text-xs font-medium text-[#c2bbb0]">
                  End time
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        endTime: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-[#c2bbb0]">Price ($) · optional
                  <input type="number" min="0" max="1000000" step="0.01" inputMode="decimal"
                    value={draft.price} onChange={e => setDraft(current => ({ ...current, price: e.target.value }))}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-3 py-3 text-base text-[#f4efe5]" />
                </label>
                <label className="text-xs font-medium text-[#c2bbb0]">Event color
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-[#242424] p-2">
                    <input type="color" value={draft.color} aria-label="Choose event color"
                      onChange={e => setDraft(current => ({ ...current, color: e.target.value }))}
                      className="h-9 w-12 cursor-pointer" />
                    <span className="truncate text-xs">{draft.color}</span>
                  </div>
                </label>
              </div>
              <label className="text-xs font-medium text-[#c2bbb0]">
                Notes
                <textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional details…"
                  className="mt-2 min-h-24 w-full rounded-xl border border-white/15 bg-[#242424] px-3.5 py-3 text-base text-[#f4efe5] outline-none focus:border-black/30"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                {draft.id && (
                  <button
                    type="button"
                    disabled={savingTask}
                    onClick={() => {
                      const task = tasks.find((item) => item.id === draft.id);
                      if (task) {
                        void deleteTask(task);
                      }
                    }}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[#c2bbb0] hover:border-[#d6b779]/50 hover:text-[#f4efe5] disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[#c2bbb0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-xl bg-[#d6b779] px-5 py-2.5 text-sm font-semibold text-[#101010] disabled:opacity-50"
                >
                  {savingTask
                    ? "Saving…"
                    : draft.id
                      ? "Save changes"
                      : "Add to schedule"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
