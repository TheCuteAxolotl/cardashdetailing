import { savedDuration, timeMinutes } from "@/lib/booking-duration";
export function chicagoClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (key: string) => parts.find((p) => p.type === key)?.value || "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}
export function validCalendarDate(
  value: string | null | undefined,
): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function shiftCalendarDate(date: string, days: number) {
  if (!validCalendarDate(date)) return "";
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function minuteLabel(value: number) {
  const n = ((value % 1440) + 1440) % 1440,
    h = Math.floor(n / 60),
    m = n % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
export function bookingInterval(
  b: {
    preferredDate: string | null;
    preferredTime?: string | null;
    notes: string | null;
    serviceName: string;
  },
  date: string,
) {
  const start = timeMinutes(b.preferredTime || "");
  if (!validCalendarDate(b.preferredDate) || start === null) return null;
  const duration = savedDuration(b.notes, b.serviceName);
  const offset =
    b.preferredDate === date
      ? 0
      : shiftCalendarDate(b.preferredDate, 1) === date
        ? -1440
        : null;
  if (offset === null) return null;
  const rawStart = start + offset,
    rawEnd = rawStart + duration;
  if (rawEnd <= 0 || rawStart >= 1440) return null;
  return {
    start: Math.max(0, rawStart),
    end: Math.min(1440, rawEnd),
    rawStart,
    rawEnd,
    duration,
    carryIn: rawStart < 0,
    carryOut: rawEnd > 1440,
  };
}
export type TimeBlock = { id: string; start: number; end: number };
/** Pack overlap groups into parallel lanes. Back-to-back jobs do not overlap. */
export function layoutTimeBlocks<T extends TimeBlock>(
  items: T[],
): Array<T & { column: number; columns: number; conflict: boolean }> {
  const sorted = [...items].sort(
    (a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id),
  );
  const result: Array<
    T & { column: number; columns: number; conflict: boolean }
  > = [];
  let group: T[] = [],
    end = -1;
  function flush() {
    const ends: number[] = [];
    const packed = group.map((item) => {
      let column = ends.findIndex((e) => e <= item.start);
      if (column < 0) column = ends.length;
      ends[column] = item.end;
      return { ...item, column };
    });
    result.push(
      ...packed.map((item) => ({
        ...item,
        columns: ends.length,
        conflict: group.some(
          (other) =>
            other.id !== item.id &&
            other.start < item.end &&
            item.start < other.end,
        ),
      })),
    );
    group = [];
  }
  for (const item of sorted) {
    if (group.length && item.start >= end) flush();
    group.push(item);
    end = group.length === 1 ? item.end : Math.max(end, item.end);
  }
  if (group.length) flush();
  return result;
}
