import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { normalizePhoneNumber, sendTransactionalSms } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "smsInbox")) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    await ensureBookingChatSchema();

    const payload = await request.json().catch(() => ({}));
    const phone = normalizePhoneNumber(String(payload.phone || ""));
    const message = String(payload.message || "").trim().slice(0, 3000);

    if (!phone) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message required." }, { status: 400 });
    }

    const latestInbound = await prisma.unmatchedSmsMessage.findFirst({
      where: { fromPhone: phone, direction: "inbound" },
      orderBy: { createdAt: "desc" },
      select: { toPhone: true },
    });

    const sms = await sendTransactionalSms({
      to: phone,
      body: `Car Dash Detailing: ${message}`,
      includeOptOutLine: false,
    });

    if (!sms.sent) {
      return NextResponse.json(
        { error: "The text could not be sent through Twilio." },
        { status: 502 }
      );
    }

    const stored = await prisma.unmatchedSmsMessage.create({
      data: {
        fromPhone: latestInbound?.toPhone || "Car Dash Detailing",
        toPhone: phone,
        body: message,
        direction: "outbound",
        externalSid: sms.sid,
      },
    });

    return NextResponse.json({ success: true, delivery: "sms", message: stored });
  } catch (error) {
    console.error("Direct unmatched SMS reply failed:", error);
    return NextResponse.json({ error: "Could not send this text message." }, { status: 500 });
  }
}
