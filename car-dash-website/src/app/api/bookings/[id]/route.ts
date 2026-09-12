import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentAccountFromRequest,
  isOwnerAccount,
  isStaffAccount,
} from "@/lib/permissions";
import { sendTransactionalSms } from "@/lib/twilio-sms";
import { addBookingSystemMessage, bookingHasSmsConsent, getBookingChatUrl } from "@/lib/booking-chat";

function statusSms(booking: {
  status: string;
  serviceName: string;
  quotedPrice: number | null;
  preferredDate: string | null;
  preferredTime: string | null;
}, chatUrl: string) {
  const total = booking.quotedPrice && booking.quotedPrice > 0 ? ` Total: $${booking.quotedPrice.toFixed(2)}.` : "";
  const when = [booking.preferredDate, booking.preferredTime].filter(Boolean).join(" at ");
  const schedule = when ? ` ${when}.` : "";

  if (booking.status === "confirmed") {
    return `Car Dash Detailing: Your ${booking.serviceName} appointment is confirmed.${schedule}${total} Reply to this text with questions or updates. Booking chat: ${chatUrl}`;
  }
  if (booking.status === "cancelled") {
    return `Car Dash Detailing: Your ${booking.serviceName} booking has been cancelled.${schedule} Reply to this text if you need help rescheduling. Booking chat: ${chatUrl}`;
  }
  if (booking.status === "completed") {
    return `Car Dash Detailing: Your ${booking.serviceName} appointment is marked complete.${total} Thank you for choosing Car Dash Detailing. Reply to this text with any questions. Booking chat: ${chatUrl}`;
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!isStaffAccount(auth)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const params = await context.params;
    const nextStatus = String(status || "").trim().toLowerCase();

    if (!["pending", "confirmed", "completed", "cancelled"].includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: nextStatus },
    });

    if (existing.status !== booking.status) {
      try {
        await addBookingSystemMessage(
          booking.id,
          `Booking status changed to ${booking.status[0].toUpperCase() + booking.status.slice(1)}.`
        );
      } catch (error) {
        console.error("Booking chat status message failed:", error);
      }

      if (bookingHasSmsConsent(booking.notes)) {
        const chatUrl = getBookingChatUrl(booking.id, booking.customerEmail, Boolean(booking.userId));
        const body = statusSms(booking, chatUrl);
        if (body) {
          await sendTransactionalSms({
            to: booking.customerPhone,
            body,
          });
        }
      }
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", error);

    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    // Only the owner can permanently delete bookings.
    if (!isOwnerAccount(auth)) {
      return NextResponse.json(
        { error: "Owner access required" },
        { status: 403 }
      );
    }

    const params = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Keep active requests protected from accidental deletion.
    if (!["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Only completed or cancelled bookings can be deleted." },
        { status: 400 }
      );
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Booking deleted permanently.",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);

    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
