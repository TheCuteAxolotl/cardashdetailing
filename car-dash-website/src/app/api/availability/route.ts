import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SLOTS = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")?.trim();
  if (!date) return NextResponse.json({ slots: [] });
  const existing = await prisma.booking.findMany({
    where: { preferredDate: date, status: { in: ["pending", "confirmed"] } },
    select: { preferredTime: true },
  });
  const taken = new Set(existing.map((b) => b.preferredTime).filter(Boolean));
  return NextResponse.json({ slots: DEFAULT_SLOTS.filter((slot) => !taken.has(slot)) });
}
