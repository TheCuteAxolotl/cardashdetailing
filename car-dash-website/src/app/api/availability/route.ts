import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BOOKING_AVAILABILITY_KEY,
  configuredSlotsForDate,
  formatBookingTime,
  isDateString,
  normalizeBookingTime,
  parseBookingAvailabilityConfig,
} from "@/lib/booking-availability";

function dateInTimeZone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

function monthIsValid(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 2020 && year <= 2100 && month >= 1 && month <= 12;
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")?.trim() || "";
  const month = request.nextUrl.searchParams.get("month")?.trim() || "";

  const configRow = await prisma.siteContent.findUnique({ where: { key: BOOKING_AVAILABILITY_KEY } });
  const config = parseBookingAvailabilityConfig(configRow?.value);
  const today = dateInTimeZone(config.timezone);

  if (month) {
    if (!monthIsValid(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });

    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const firstDate = `${month}-01`;
    const lastDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;
    const existing = await prisma.booking.findMany({
      where: {
        preferredDate: { gte: firstDate, lte: lastDate },
        status: { in: ["pending", "confirmed"] },
      },
      select: { preferredDate: true, preferredTime: true },
    });

    const takenByDate = new Map<string, Set<string>>();
    for (const booking of existing) {
      const bookingDate = String(booking.preferredDate || "").trim();
      const normalized = normalizeBookingTime(booking.preferredTime);
      if (!bookingDate || !normalized) continue;
      const set = takenByDate.get(bookingDate) || new Set<string>();
      set.add(normalized);
      takenByDate.set(bookingDate, set);
    }

    const days: Record<string, { available: boolean; remaining: number; closed: boolean }> = {};
    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = `${month}-${String(day).padStart(2, "0")}`;
      const configured = configuredSlotsForDate(config, currentDate);
      const taken = takenByDate.get(currentDate) || new Set<string>();
      const remaining = configured.filter((slot) => !taken.has(slot)).length;
      const isPast = currentDate < today;
      days[currentDate] = {
        available: !isPast && remaining > 0,
        remaining: isPast ? 0 : remaining,
        closed: isPast || configured.length === 0,
      };
    }

    return NextResponse.json({ month, today, days });
  }

  if (!isDateString(date)) return NextResponse.json({ slots: [], closed: true, today });
  if (date < today) return NextResponse.json({ date, slots: [], closed: true, today });

  const existing = await prisma.booking.findMany({
    where: { preferredDate: date, status: { in: ["pending", "confirmed"] } },
    select: { preferredTime: true },
  });

  const configured = configuredSlotsForDate(config, date);
  const taken = new Set(
    existing
      .map((booking) => normalizeBookingTime(booking.preferredTime))
      .filter((value): value is string => Boolean(value))
  );
  const open = configured.filter((slot) => !taken.has(slot));

  return NextResponse.json({
    date,
    today,
    closed: configured.length === 0,
    slots: open.map(formatBookingTime),
  });
}
