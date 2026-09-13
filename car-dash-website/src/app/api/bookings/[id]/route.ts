import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentAccountFromRequest,
  isOwnerAccount,
  hasStaffPermission,
} from "@/lib/permissions";
import { sendTransactionalSms } from "@/lib/twilio-sms";
import { addBookingSystemMessage, bookingHasSmsConsent, getBookingChatUrl } from "@/lib/booking-chat";
import {
  activateBookingStatusWithSlotProtection,
  BookingSlotConflictError,
  BookingSlotUnavailableError,
  updateBookingScheduleWithSlotProtection,
} from "@/lib/booking-slot";
import { formatBookingTime, isDateString, normalizeBookingTime } from "@/lib/booking-availability";

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

    if (!hasStaffPermission(auth, "bookings")) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const params = await context.params;
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const wantsScheduleChange = body.preferredDate !== undefined || body.preferredTime !== undefined;
    if (wantsScheduleChange) {
      const preferredDate = String(body.preferredDate || "").trim();
      const preferredTime = String(body.preferredTime || "").trim();
      if (!isDateString(preferredDate) || !normalizeBookingTime(preferredTime)) {
        return NextResponse.json({ error: "Choose a valid booking date and time." }, { status: 400 });
      }

      const booking = await updateBookingScheduleWithSlotProtection(
        existing.id,
        preferredDate,
        preferredTime
      );
      const when = `${preferredDate} at ${formatBookingTime(preferredTime)}`;

      try {
        await addBookingSystemMessage(booking.id, `Appointment time updated to ${when}.`);
      } catch (error) {
        console.error("Booking schedule chat message failed:", error);
      }

      if (bookingHasSmsConsent(booking.notes)) {
        const chatUrl = getBookingChatUrl(booking.id, booking.customerEmail, Boolean(booking.userId));
        await sendTransactionalSms({
          to: booking.customerPhone,
          body: `Car Dash Detailing: Your ${booking.serviceName} appointment time was updated to ${when}. Reply to this text if you have any questions. Booking chat: ${chatUrl}`,
        });
      }

      return NextResponse.json(booking, { status: 200 });
    }

    const nextStatus = String(body.status || "").trim().toLowerCase();
    if (!["pending", "confirmed", "completed", "cancelled"].includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    const booking = nextStatus === "pending" || nextStatus === "confirmed"
      ? await activateBookingStatusWithSlotProtection(existing.id, nextStatus)
      : await prisma.booking.update({ where: { id: existing.id }, data: { status: nextStatus } });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

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
        const smsBody = statusSms(booking, chatUrl);
        if (smsBody) {
          await sendTransactionalSms({
            to: booking.customerPhone,
            body: smsBody,
          });
        }
      }
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", error);
    if (error instanceof BookingSlotConflictError || error instanceof BookingSlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

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
