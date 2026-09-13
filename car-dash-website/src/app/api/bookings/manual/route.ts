import { NextRequest, NextResponse } from "next/server";
import {
  BookingSlotConflictError,
  BookingSlotUnavailableError,
  createBookingWithSlotProtection,
} from "@/lib/booking-slot";
import { formatBookingTime, isDateString, normalizeBookingTime } from "@/lib/booking-availability";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

function clean(value: unknown, max = 300) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "bookings")) {
      return NextResponse.json({ error: "Booking access required" }, { status: 403 });
    }

    const body = await request.json();
    const customerName = clean(body.customerName, 120);
    const serviceName = clean(body.serviceName, 160) || "Outside Booking";
    const preferredDate = clean(body.preferredDate, 10);
    const preferredTime = clean(body.preferredTime, 30);
    const normalizedTime = normalizeBookingTime(preferredTime);

    if (!customerName) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }
    if (!isDateString(preferredDate) || !normalizedTime) {
      return NextResponse.json({ error: "Choose a valid booking date and time." }, { status: 400 });
    }

    const quotedPriceRaw = body.quotedPrice === "" || body.quotedPrice == null ? null : Number(body.quotedPrice);
    const quotedPrice = quotedPriceRaw != null && Number.isFinite(quotedPriceRaw)
      ? Math.max(0, Math.round(quotedPriceRaw * 100) / 100)
      : null;
    const ownerNotes = clean(body.notes, 2000);
    const notes = [
      "Booking source: Added manually from the Car Dash dashboard",
      `Scheduled: ${preferredDate} at ${formatBookingTime(normalizedTime)}`,
      "SMS consent: No consent recorded from website booking flow",
      ownerNotes ? `Owner notes: ${ownerNotes}` : null,
    ].filter(Boolean).join("\n");

    const booking = await createBookingWithSlotProtection({
      userId: null,
      vehicleId: null,
      serviceName,
      serviceMethod: clean(body.serviceMethod, 60) || "mobile",
      customerName,
      customerEmail: clean(body.customerEmail, 240),
      customerPhone: clean(body.customerPhone, 60),
      vehicleMake: clean(body.vehicleMake, 100) || "Not specified",
      vehicleModel: clean(body.vehicleModel, 100) || "Not specified",
      vehicleYear: clean(body.vehicleYear, 20) || "Not specified",
      vehicleTrim: clean(body.vehicleTrim, 100) || null,
      preferredDate,
      preferredTime,
      quotedPrice,
      notes,
      status: "confirmed",
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Manual booking creation failed:", error);
    if (error instanceof BookingSlotConflictError || error instanceof BookingSlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not add the booking." }, { status: 500 });
  }
}
