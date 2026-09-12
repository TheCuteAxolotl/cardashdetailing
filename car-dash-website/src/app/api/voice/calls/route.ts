import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "businessPhone")) {
      return NextResponse.json({ error: "Business Phone access required." }, { status: 403 });
    }

    await ensureCallSystemSchema();

    const [calls, bookings] = await Promise.all([
      prisma.callLog.findMany({ orderBy: { startedAt: "desc" }, take: 150 }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 600,
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          serviceName: true,
          vehicleYear: true,
          vehicleMake: true,
          vehicleModel: true,
          vehicleTrim: true,
          status: true,
        },
      }),
    ]);

    const byPhone = new Map<string, (typeof bookings)[number]>();
    for (const booking of bookings) {
      const phone = normalizePhoneNumber(booking.customerPhone);
      if (phone && !byPhone.has(phone)) byPhone.set(phone, booking);
    }

    return NextResponse.json({
      calls: calls.map((call) => ({
        ...call,
        customer: byPhone.get(normalizePhoneNumber(call.fromPhone) || "") || null,
      })),
    });
  } catch (error) {
    console.error("Call history load failed:", error);
    return NextResponse.json({ error: "Could not load call history." }, { status: 500 });
  }
}
