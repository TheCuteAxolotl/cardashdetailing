import { NextRequest, NextResponse } from "next/server";
import {
  BookingSlotConflictError,
  BookingSlotUnavailableError,
  createBookingWithSlotProtection,
} from "@/lib/booking-slot";
import { formatBookingTime, isDateString, normalizeBookingTime } from "@/lib/booking-availability";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { replaceBookingOwnerDetails } from "@/lib/booking-owner-details";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { manualBookingConfirmationText } from "@/lib/manual-booking-confirmation";

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
    const customerPhone = clean(body.customerPhone, 60);
    const normalizedPhone = normalizePhoneNumber(customerPhone);
    // Checked by default in the manual booking form. Staff can turn this off
    // for customers who didn't agree to transactional appointment texts.
    const sendConfirmationSms = body.sendConfirmationSms !== false;
    if (sendConfirmationSms && customerPhone && !normalizedPhone) {
      return NextResponse.json({
        error: "Enter a valid mobile number, or turn off the booking confirmation text.",
      }, { status: 400 });
    }
    const baseNotes = [
      "Booking source: Added manually from the Car Dash dashboard",
      `Scheduled: ${preferredDate} at ${formatBookingTime(normalizedTime)}`,
      "SMS consent: " + (sendConfirmationSms && normalizedPhone ? "Yes" : "No"),
      "SMS consent source: Manually booked by staff (appointment updates only)",
    ].filter(Boolean).join("\n");
    const notes = replaceBookingOwnerDetails(baseNotes, clean(body.serviceAddress, 500), ownerNotes);

    const booking = await createBookingWithSlotProtection({
      userId: null,
      vehicleId: null,
      serviceName,
      serviceMethod: "mobile",
      customerName,
      customerEmail: clean(body.customerEmail, 240),
      customerPhone,
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

    // A confirmed manual booking is saved even if the SMS provider is unavailable.
    // Return the actual send result so the dashboard never claims a failed text sent.
    let confirmationSms: { status: "sent" | "failed" | "skipped"; reason?: string };
    if (!sendConfirmationSms) {
      confirmationSms = { status: "skipped", reason: "disabled" };
    } else if (!normalizedPhone) {
      confirmationSms = { status: "skipped", reason: "missing_phone" };
    } else {
      try {
        const result = await sendCustomerSmsWithHistory({
          to: normalizedPhone,
          body: manualBookingConfirmationText(booking, clean(body.serviceAddress, 500)),
        });
        confirmationSms = result.sent
          ? { status: "sent" }
          : { status: "failed", reason: result.reason || "provider_error" };
      } catch (smsError) {
        console.error("Manual booking confirmation SMS failed:", smsError);
        confirmationSms = { status: "failed", reason: "provider_error" };
      }
    }

    return NextResponse.json({ booking, confirmationSms }, { status: 201 });
  } catch (error) {
    console.error("Manual booking creation failed:", error);
    if (error instanceof BookingSlotConflictError || error instanceof BookingSlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not add the booking." }, { status: 500 });
  }
}
