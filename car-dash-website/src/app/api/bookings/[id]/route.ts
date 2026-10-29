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
  confirmBookingWithDetails,
  BookingSlotConflictError,
  BookingSlotUnavailableError,
  updateBookingScheduleWithSlotProtection,
  updateBookingDetailsWithSlotProtection,
} from "@/lib/booking-slot";
import { formatBookingTime, isDateString, normalizeBookingTime } from "@/lib/booking-availability";
import { replaceBookingOwnerDetails, bookingServiceAddress, bookingOwnerNotes } from "@/lib/booking-owner-details";


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

    if (body.action === "editDetails") {
      // An edit is not a new booking, a status change, or a quote conversion.
      // Keep website consent, source metadata, photo evidence and original customer notes.
      const date = String(body.preferredDate ?? existing.preferredDate ?? "").trim();
      const time = String(body.preferredTime ?? existing.preferredTime ?? "").trim();
      if (!isDateString(date) || !normalizeBookingTime(time)) {
        return NextResponse.json({ error: "Enter a valid appointment date and time." }, { status: 400 });
      }
      if (typeof body.updatedAt === "string" && body.updatedAt &&
          new Date(body.updatedAt).getTime() !== existing.updatedAt.getTime()) {
        return NextResponse.json({ error: "This booking was updated elsewhere. Refresh before saving your changes." }, { status: 409 });
      }
      const clean = (key: string, max: number, fallback: string) =>
        body[key] === undefined ? fallback : String(body[key] ?? "").trim().slice(0, max);
      const customerName = clean("customerName", 150, existing.customerName);
      const serviceName = clean("serviceName", 240, existing.serviceName);
      const customerEmail = clean("customerEmail", 240, existing.customerEmail);
      const customerPhone = clean("customerPhone", 60, existing.customerPhone);
      if (!customerName || !serviceName) {
        return NextResponse.json({ error: "Customer name and service are required." }, { status: 400 });
      }
      if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return NextResponse.json({ error: "Enter a valid email address or leave it blank." }, { status: 400 });
      }
      const price = body.quotedPrice === undefined ? existing.quotedPrice :
        body.quotedPrice === "" || body.quotedPrice === null ? null : Number(body.quotedPrice);
      if (price !== null && (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 100000)) {
        return NextResponse.json({ error: "Enter a valid booking price." }, { status: 400 });
      }
      const address = String(body.serviceAddress ?? "").trim();
      const ownerNotes = String(body.ownerNotes ?? "").trim();
      if (address.length > 500 || ownerNotes.length > 4000) {
        return NextResponse.json({ error: "Address or notes are too long." }, { status: 400 });
      }
      const nextNotes = replaceBookingOwnerDetails(existing.notes, address, ownerNotes);
      const before = normalizeBookingTime(existing.preferredTime);
      const after = normalizeBookingTime(time);
      const scheduleChanged = existing.preferredDate !== date || before !== after;
      const booking = await updateBookingDetailsWithSlotProtection(existing.id, {
        customerName, customerEmail, customerPhone,
        serviceName,
        vehicleYear: clean("vehicleYear", 20, existing.vehicleYear),
        vehicleMake: clean("vehicleMake", 100, existing.vehicleMake),
        vehicleModel: clean("vehicleModel", 100, existing.vehicleModel),
        vehicleTrim: clean("vehicleTrim", 100, existing.vehicleTrim || "") || null,
        quotedPrice: price, notes: nextNotes,
      }, date, time);
      if (scheduleChanged) {
        const when = `${date} at ${formatBookingTime(time)}`;
        try {
          await addBookingSystemMessage(booking.id, `Appointment time updated to ${when}.`);
        } catch (error) {
          console.error("Booking chat schedule update failed:", error);
        }
        if (bookingHasSmsConsent(existing.notes) && customerPhone) {
          const chatUrl = getBookingChatUrl(booking.id, booking.customerEmail, Boolean(booking.userId));
          try {
            await sendTransactionalSms({
              to: customerPhone,
              body: `Car Dash Detailing: Your ${booking.serviceName} appointment was updated to ${when}. Reply with questions. Booking chat: ${chatUrl}`,
            });
          } catch (error) {
            console.error("Booking schedule update SMS failed:", error);
          }
        }
      }
      return NextResponse.json(booking, { status: 200 });
    }

    if (body.action === "confirmWithDetails") {
      const date=String(body.preferredDate||"").trim(), time=String(body.preferredTime||"").trim();
      if(!isDateString(date)||!normalizeBookingTime(time)||!String(body.customerName||"").trim()||!String(body.serviceName||"").trim()) return NextResponse.json({error:"Name, service, date and time are required."},{status:400});
      const price=body.quotedPrice===""||body.quotedPrice==null?null:Number(body.quotedPrice);
      if(price!==null&&(!Number.isFinite(price)||price<0)) return NextResponse.json({error:"Enter a valid price."},{status:400});
      const details: Record<string,string>={};
      for(const field of ["customerName","customerEmail","customerPhone","vehicleMake","vehicleModel","vehicleYear","vehicleTrim","serviceName"]) details[field]=String(body[field]??existing[field as keyof typeof existing]??"").trim().slice(0,240);
      // Preserve original consent, evidence and duration metadata.
      const notes=existing.notes||"";
      const extra=String(body.notes||"").trim().slice(0,2000);
      const updatedNotes = replaceBookingOwnerDetails(
        extra && extra !== notes ? notes + "\nOwner scheduling notes: " + extra : notes,
        body.serviceAddress !== undefined ? String(body.serviceAddress || "").trim().slice(0, 500) : bookingServiceAddress(notes),
        body.notes !== undefined ? extra : bookingOwnerNotes(notes)
      );
      const booking=await confirmBookingWithDetails(existing.id,{...details,quotedPrice:price,notes:updatedNotes},date,time);
      return NextResponse.json(booking);
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
