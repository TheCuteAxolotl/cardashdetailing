"use client";

import { normalizeBookingTime } from "@/lib/booking-availability";
import type { OwnerScheduleTask } from "@/lib/owner-schedule";
import type { EditableBooking } from "@/components/BookingDetailsEditor";
import { bookingServiceAddress } from "@/lib/booking-owner-details";

type CalendarBooking = EditableBooking;

type CalendarItem =
  | { kind: "booking"; id: string; time: string; booking: CalendarBooking }
  | { kind: "task"; id: string; time: string; task: OwnerScheduleTask };

type Props = {
  view: "week" | "month";
  cursor: Date;
  days: Date[];
  today: Date;
  selectedDay: string;
  bookings: CalendarBooking[];
  tasks: OwnerScheduleTask[];
  onSelectDay: (date: string) => void;
  onEditBooking: (booking: CalendarBooking) => void;
  onAddTask: (date: string) => void;
  onEditTask: (task: OwnerScheduleTask) => void;
  onToggleTask: (task: OwnerScheduleTask) => void;
};

const iso = (day: Date) => {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + date;
};
const prettyTime = (value?: string | null) => {
  const normalized = normalizeBookingTime(value);
  if (!normalized) return "Anytime";
  const [hours, minutes] = normalized.split(":");
  return String(Number(hours) % 12 || 12) + ":" + minutes + (Number(hours) >= 12 ? " PM" : " AM");
};
const compactTime = (value?: string | null) => {
  const normalized = normalizeBookingTime(value);
  if (!normalized) return "";
  const [hours, minutes] = normalized.split(":");
  return String(Number(hours) % 12 || 12) + (minutes === "00" ? "" : ":" + minutes) + (Number(hours) >= 12 ? "p" : "a");
};
const money = (price: number) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0}).format(price);

function bookingColor(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
    case "accepted":
    case "approved":
      return "border-[#396958] bg-[#214335] text-[#c8f2d9]";
    case "completed":
      return "border-[#3b5d78] bg-[#243c52] text-[#c9e5fa]";
    case "pending":
    case "requested":
      return "border-[#86673b] bg-[#4c3924] text-[#ffe0ab]";
    default:
      return "border-[#5b5678] bg-[#35314c] text-[#e5dcfc]";
  }
}
const taskColor = (task: OwnerScheduleTask) =>
  task.completed ? "border-white/10 bg-[#262626] text-[#9c9c9c]" :
  task.type === "plan" ? "border-[#555177] bg-[#36324c] text-[#e8ddff]" :
  "border-[#526a75] bg-[#253b46] text-[#d0ebf5]";

export default function OwnerCalendarBoard({
  view, cursor, days, today, selectedDay, bookings, tasks,
  onSelectDay, onAddTask, onEditTask, onToggleTask, onEditBooking,
}: Props) {
  const index = new Map<string, CalendarItem[]>();
  for (const booking of bookings) {
    if (!booking.preferredDate) continue;
    const existing = index.get(booking.preferredDate) || [];
    existing.push({kind:"booking", id: booking.id, time: normalizeBookingTime(booking.preferredTime) || "99:99", booking});
    index.set(booking.preferredDate, existing);
  }
  for (const task of tasks) {
    const existing = index.get(task.date) || [];
    existing.push({kind:"task", id: task.id, time: normalizeBookingTime(task.time) || "99:99", task});
    index.set(task.date, existing);
  }
  for (const items of index.values()) items.sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));

  const chosenDate = days.find(day => iso(day) === selectedDay);
  const chosenItems = index.get(selectedDay) || [];

  return (
    <>
      <div className="calendar-board-scroll overflow-x-auto overscroll-x-contain rounded-b-[20px]" aria-label={view === "month" ? "Month calendar. Scroll sideways on small screens to see all seven days." : "Weekly calendar"}>
        <div className={"min-w-[850px] xl:min-w-0"}>
          <div className="grid grid-cols-7 border-b border-white/10 bg-[#202020]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className={"py-3.5 text-center text-[11px] font-semibold uppercase tracking-[.13em] " + (i >= 5 ? "text-[#99958d]" : "text-[#d2cbc0]")}>
                {day}
              </div>
            ))}
          </div>

          <div className={"grid grid-cols-7 bg-[#161616] " + (view === "month" ? "" : "min-h-[360px]")}>
            {days.map((day, idx) => {
              const date = iso(day);
              const selected = date === selectedDay;
              const current = date === iso(today);
              const withinMonth = day.getMonth() === cursor.getMonth();
              const items = index.get(date) || [];
              const visible = view === "month" ? items.slice(0, 3) : items;
              return (
                <div
                  key={date}
                  className={[
                    "group relative min-w-0 border-r border-b border-white/[.08] p-2.5 transition-colors sm:p-3",
                    view === "month" ? "min-h-[136px] lg:min-h-[148px]" : "min-h-[320px]",
                    withinMonth || view === "week" ? "bg-[#1c1c1c]" : "bg-[#171717]",
                    selected ? "ring-1 ring-inset ring-[#d6b779]/65" : "hover:bg-[#252525]",
                    idx % 7 === 6 ? "border-r-0" : "",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectDay(date)}
                      aria-label={"Show " + day.toLocaleDateString("en-US", {month:"long", day:"numeric", year:"numeric"})}
                      aria-pressed={selected}
                      className={[
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition",
                        current ? "bg-[#d6b779] text-[#101010]" :
                        selected ? "bg-[#3c3528] text-[#f4dfad]" :
                        withinMonth || view === "week" ? "text-[#ede6dc] hover:bg-white/10" : "text-[#77736c]",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </button>
                    {items.length > 0 ? <span className="text-[10px] tabular-nums text-[#a9a49b]">{items.length}</span> : null}
                    <button
                      type="button"
                      onClick={() => onAddTask(date)}
                      aria-label={"Add schedule item on " + date}
                      className="grid h-7 w-7 place-items-center rounded-lg text-base leading-none text-[#999289] opacity-100 transition hover:bg-[#38332a] hover:text-[#e5c995] xl:opacity-0 xl:group-hover:opacity-100 focus:opacity-100"
                    >+</button>
                  </div>
                  <div className="space-y-1.5">
                    {visible.map(item => item.kind === "booking" ? (
                      <button
                        type="button"
                        key={"booking-" + item.id}
                        onClick={() => onEditBooking(item.booking)}
                        title={prettyTime(item.booking.preferredTime) + " · " + (item.booking.customerName || "Customer") + " · " + (item.booking.serviceName || "Detailing")}
                        className={"block w-full rounded-md border-l-[3px] px-2 py-2 text-left transition hover:brightness-125 " + bookingColor(item.booking.status)}
                      >
                        <span className="block truncate text-[10px] font-bold leading-4">{compactTime(item.booking.preferredTime)}{item.booking.preferredTime ? " · " : ""}{item.booking.customerName || "Customer"}</span>
                        <span className="mt-0.5 block truncate text-[10px] leading-4 opacity-85">{item.booking.serviceName || "Detailing"}</span>
                      </button>
                    ) : (
                      <button
                        key={"task-" + item.id}
                        type="button"
                        onClick={() => onEditTask(item.task)}
                        title={item.task.title}
                        className={"block w-full rounded-md border-l-[3px] px-2 py-2 text-left transition hover:brightness-125 " + taskColor(item.task)}
                      >
                        <span className="block truncate text-[10px] font-bold leading-4">{compactTime(item.task.time)}{item.task.time ? " · " : ""}{item.task.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] leading-4 opacity-80">{item.task.type === "todo" ? (item.task.completed ? "Completed" : "To-do") : "Plan"}</span>
                      </button>
                    ))}
                    {items.length > visible.length && (
                      <button type="button" onClick={() => onSelectDay(date)} className="w-full rounded-md px-1 py-1 text-left text-[10px] font-semibold text-[#e5c995] hover:bg-white/5">
                        + {items.length - visible.length} more
                      </button>
                    )}
                    {view === "week" && !items.length ? (
                      <button type="button" onClick={() => onAddTask(date)} className="w-full rounded-lg border border-dashed border-white/10 py-7 text-center text-xs text-[#88847e] hover:border-[#d6b779]/40 hover:text-[#d6b779]">
                        + Add plan
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="border-t border-white/10 bg-[#1b1b1b] px-4 py-5 sm:px-6" aria-label="Selected day schedule">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d6b779]">Day details</p>
            <h4 className="mt-1.5 text-lg font-semibold text-[#f4efe5]">
              {chosenDate ? chosenDate.toLocaleDateString("en-US", {weekday:"long", month:"long", day:"numeric"}) : "Choose a date"}
            </h4>
          </div>
          <button type="button" onClick={() => onAddTask(selectedDay)} className="rounded-xl border border-[#d6b779]/35 px-4 py-2.5 text-xs font-semibold text-[#e5c995] hover:bg-[#d6b779]/10">
            + Add a plan
          </button>
        </div>
        {chosenItems.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {chosenItems.map(item => item.kind === "booking" ? (
              <div key={"day-booking-" + item.id} className={"min-w-0 rounded-xl border p-3.5 " + bookingColor(item.booking.status)}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
                  <span>{prettyTime(item.booking.preferredTime)}</span>
                  <span className="capitalize opacity-75">{item.booking.status || "Booking"}</span>
                </div>
                <p className="mt-2 truncate text-sm font-bold">{item.booking.customerName || "Customer"}</p>
                <p className="mt-1 line-clamp-2 text-xs opacity-80">{item.booking.serviceName || "Detailing"}{item.booking.vehicleMake ? " · " + [item.booking.vehicleYear, item.booking.vehicleMake, item.booking.vehicleModel].filter(Boolean).join(" ") : ""}</p>
                {bookingServiceAddress(item.booking.notes)
                  ? <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="min-w-0 flex-1 break-words">📍 {bookingServiceAddress(item.booking.notes)}</span>
                      <a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(bookingServiceAddress(item.booking.notes))} target="_blank" rel="noopener noreferrer" className="shrink-0 underline">Maps</a>
                    </p>
                  : <p className="mt-3 text-xs font-bold text-amber-200">⚠ Service address missing</p>}
                {Number(item.booking.quotedPrice || 0) > 0 ? <p className="mt-2 text-sm font-semibold">{money(Number(item.booking.quotedPrice))}</p> : null}
                <button type="button" onClick={() => onEditBooking(item.booking)} className="mt-3 w-full rounded-lg border border-current/30 px-3 py-2 text-xs font-bold hover:brightness-125">Edit booking / address</button>
              </div>
            ) : (
              <div key={"day-task-" + item.id} className={"min-w-0 rounded-xl border p-3.5 " + taskColor(item.task)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold">{item.task.time ? prettyTime(item.task.time) : item.task.type === "plan" ? "Plan" : "To-do"}</span>
                  <span className="text-[10px] uppercase opacity-75">{item.task.type}</span>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  {item.task.type === "todo" ? (
                    <input type="checkbox" checked={item.task.completed} onChange={() => onToggleTask(item.task)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d6b779]" aria-label={"Mark " + item.task.title + " complete"} />
                  ) : null}
                  <button type="button" onClick={() => onEditTask(item.task)} className="min-w-0 flex-1 text-left">
                    <span className={"block text-sm font-semibold " + (item.task.completed ? "line-through opacity-60" : "")}>{item.task.title}</span>
                    {item.task.notes ? <span className="mt-1 block line-clamp-2 text-xs opacity-75">{item.task.notes}</span> : null}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#aaa49a]">Nothing scheduled for this day yet.</p>}
      </section>
    </>
  );
}
