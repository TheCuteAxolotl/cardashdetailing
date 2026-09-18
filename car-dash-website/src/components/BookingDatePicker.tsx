"use client";

import { useEffect, useMemo, useState } from "react";

type DayState = {
  available: boolean;
  remaining: number;
  closed: boolean;
};

type MonthAvailability = {
  month: string;
  today: string;
  days: Record<string, DayState>;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function monthFromDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1)
  );
}

function dateLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Choose a date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(year, month - 1, day)
  );
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + amount, 1);
  return monthFromDate(next);
}

export default function BookingDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => value?.slice(0, 7) || monthFromDate(new Date()));
  const [availability, setAvailability] = useState<MonthAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (value && value.slice(0, 7) !== visibleMonth) setVisibleMonth(value.slice(0, 7));
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/availability?month=${encodeURIComponent(visibleMonth)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Could not load calendar availability.");
        return data as MonthAvailability;
      })
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch((reason) => {
        if (!cancelled) {
          setAvailability(null);
          setError(reason instanceof Error ? reason.message : "Could not load calendar availability.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  const calendar = useMemo(() => {
    const [year, monthNumber] = visibleMonth.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const firstDay = new Date(year, monthNumber - 1, 1).getDay();
    const cells: Array<{ day: number; date: string } | null> = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, date: `${visibleMonth}-${pad(day)}` });
    }
    return cells;
  }, [visibleMonth]);

  const currentMonth = availability?.today?.slice(0, 7) || monthFromDate(new Date());
  const canGoBack = visibleMonth > currentMonth;

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-2xl border bg-black/50 px-4 py-3 text-left text-base outline-none transition ${
          open ? "border-[#6EAEC6]/60" : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={value ? "text-white" : "text-white/45"}>{dateLabel(value)}</span>
        <span aria-hidden="true" className="text-white/45">▾</span>
      </button>

      {open && (
        <div className="mt-3 rounded-[24px] border border-white/10 bg-[#151515] p-4 shadow-2xl shadow-black/40 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => canGoBack && setVisibleMonth((current) => shiftMonth(current, -1))}
              disabled={!canGoBack}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-2xl text-white transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-20"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="text-base font-semibold text-white sm:text-lg">{monthLabel(visibleMonth)}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-2xl text-white transition hover:border-white/25"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[.08em] text-white/35 sm:gap-2">
            {WEEKDAYS.map((weekday) => <div key={weekday} className="py-1">{weekday}</div>)}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
            {calendar.map((cell, index) => {
              if (!cell) return <div key={`blank-${index}`} className="aspect-square" />;
              const state = availability?.days?.[cell.date];
              const unavailable = loading || !state?.available;
              const selected = value === cell.date;
              const today = availability?.today === cell.date;
              return (
                <button
                  type="button"
                  key={cell.date}
                  disabled={unavailable}
                  onClick={() => {
                    onChange(cell.date);
                    setOpen(false);
                  }}
                  className={`relative aspect-square min-h-10 rounded-xl text-sm font-semibold transition sm:min-h-11 ${
                    selected
                      ? "bg-[#6EAEC6] text-black"
                      : unavailable
                        ? "cursor-not-allowed bg-white/[.025] text-white/20"
                        : "bg-white/[.04] text-white hover:bg-white/[.09]"
                  } ${today && !selected ? "ring-1 ring-[#6EAEC6]/50" : ""}`}
                  aria-label={`${dateLabel(cell.date)}${unavailable ? ", unavailable" : `, ${state?.remaining || 0} time slots available`}`}
                  title={unavailable ? "Unavailable" : `${state?.remaining || 0} time slot${state?.remaining === 1 ? "" : "s"} available`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/40">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-white/[.08]" />Available</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-white/[.025] ring-1 ring-white/10" />Unavailable / booked</span>
            </div>
            {loading && <span>Checking availability…</span>}
            {!loading && error && <span className="text-[#FF5A5A]">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
