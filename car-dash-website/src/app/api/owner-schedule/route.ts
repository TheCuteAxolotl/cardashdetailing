import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/invoices";
import {
  DEFAULT_OWNER_SCHEDULE,
  parseOwnerSchedule,
  sanitizeOwnerSchedule,
} from "@/lib/owner-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "owner:schedule";

export async function GET() {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const row = await prisma.siteContent.findUnique({ where: { key: KEY } });
    const schedule = row ? parseOwnerSchedule(row.value) : DEFAULT_OWNER_SCHEDULE;
    return NextResponse.json(schedule, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Owner schedule read failed:", error);
    return NextResponse.json({ error: "Could not load schedule" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const schedule = sanitizeOwnerSchedule(body);

    await prisma.siteContent.upsert({
      where: { key: KEY },
      create: { key: KEY, value: JSON.stringify(schedule) },
      update: { value: JSON.stringify(schedule) },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Owner schedule update failed:", error);
    return NextResponse.json({ error: "Could not save schedule" }, { status: 500 });
  }
}
