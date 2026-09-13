import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BOOKING_AVAILABILITY_KEY,
  parseBookingAvailabilityConfig,
} from "@/lib/booking-availability";
import {
  getCurrentAccountFromRequest,
  hasStaffPermission,
  isOwnerAccount,
} from "@/lib/permissions";

function canManageAvailability(auth: Awaited<ReturnType<typeof getCurrentAccountFromRequest>>) {
  return isOwnerAccount(auth) || hasStaffPermission(auth, "bookings");
}

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!canManageAvailability(auth)) {
    return NextResponse.json({ error: "Booking access required" }, { status: 403 });
  }

  const row = await prisma.siteContent.findUnique({ where: { key: BOOKING_AVAILABILITY_KEY } });
  return NextResponse.json({ config: parseBookingAvailabilityConfig(row?.value) });
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!canManageAvailability(auth)) {
      return NextResponse.json({ error: "Booking access required" }, { status: 403 });
    }

    const body = await request.json();
    const config = parseBookingAvailabilityConfig(body?.config);

    await prisma.siteContent.upsert({
      where: { key: BOOKING_AVAILABILITY_KEY },
      update: { value: JSON.stringify(config) },
      create: { key: BOOKING_AVAILABILITY_KEY, value: JSON.stringify(config) },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Could not save booking availability:", error);
    return NextResponse.json({ error: "Could not save booking availability" }, { status: 500 });
  }
}
