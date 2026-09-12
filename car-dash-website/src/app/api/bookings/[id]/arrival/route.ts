import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingHasSmsConsent, ensureBookingConversation } from "@/lib/booking-chat";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { normalizePhoneNumber, sendTransactionalSms } from "@/lib/twilio-sms";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "bookings")) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!bookingHasSmsConsent(booking.notes)) {
      return NextResponse.json(
        { error: "This customer did not opt in to SMS updates for this booking." },
        { status: 400 }
      );
    }

    if (!normalizePhoneNumber(booking.customerPhone)) {
      return NextResponse.json({ error: "This booking does not have a valid mobile number." }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const mode = String(payload.mode || "").trim();
    const eta = String(payload.eta || "").trim().slice(0, 80);

    let message = "";
    if (mode === "on_the_way") {
      message = "Your detailer is on the way. We’ll see you soon!";
    } else if (mode === "eta") {
      if (!eta) {
        return NextResponse.json({ error: "Enter the expected arrival time." }, { status: 400 });
      }
      message = `Your detailer is on the way and is expected to arrive around ${eta}. We’ll see you soon!`;
    } else {
      return NextResponse.json({ error: "Choose an arrival update type." }, { status: 400 });
    }

    const sms = await sendTransactionalSms({
      to: booking.customerPhone,
      body: `Car Dash Detailing: ${message}`,
      includeOptOutLine: false,
    });

    if (!sms.sent) {
      return NextResponse.json({ error: "Could not send the arrival text right now." }, { status: 502 });
    }

    const conversation = await ensureBookingConversation(booking.id);
    const now = new Date();
    await prisma.bookingMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "team",
        body: message,
        channel: "sms",
        externalSid: sms.sid,
      },
    });
    await prisma.bookingConversation.update({
      where: { id: conversation.id },
      data: { lastStaffSeenAt: now, updatedAt: now },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Arrival SMS failed:", error);
    return NextResponse.json({ error: "Could not send the arrival update." }, { status: 500 });
  }
}
