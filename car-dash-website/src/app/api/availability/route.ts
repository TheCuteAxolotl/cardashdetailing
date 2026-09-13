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

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")?.trim() || "";
  if (!isDateString(date)) return NextResponse.json({ slots: [], closed: true });

  const [configRow, existing] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: BOOKING_AVAILABILITY_KEY } }),
    prisma.booking.findMany({
      where: { preferredDate: date, status: { in: ["pending", "confirmed"] } },
      select: { preferredTime: true },
    }),
  ]);

  const config = parseBookingAvailabilityConfig(configRow?.value);
  const configured = configuredSlotsForDate(config, date);
  const taken = new Set(
    existing
      .map((booking) => normalizeBookingTime(booking.preferredTime))
      .filter((value): value is string => Boolean(value))
  );
  const open = configured.filter((slot) => !taken.has(slot));

  return NextResponse.json({
    date,
    closed: configured.length === 0,
    slots: open.map(formatBookingTime),
  });
}
