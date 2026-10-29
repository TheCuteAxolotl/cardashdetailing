import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOKING_AVAILABILITY_KEY, isStartInPast, normalizeBookingTime, parseBookingAvailabilityConfig } from "@/lib/booking-availability";
import { bookingHasSmsConsent, ensureBookingConversation } from "@/lib/booking-chat";
import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { appointmentReminderBody, appointmentReminderKey, DEFAULT_REMINDER_TIMEZONE } from "@/lib/detail-appointment-reminders";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function uniqueConstraint(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function getReminderDetails(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found.", status: 404 } as const;
  if (booking.status !== "confirmed") {
    return { error: "Reminders can only be sent for confirmed appointments.", status: 409 } as const;
  }
  if (!booking.preferredDate || !normalizeBookingTime(booking.preferredTime)) {
    return { error: "Set the appointment date and time before sending a reminder.", status: 400 } as const;
  }
  if (!normalizePhoneNumber(booking.customerPhone)) {
    return { error: "Add a valid customer mobile number before sending.", status: 400 } as const;
  }

  const config = await prisma.siteContent.findUnique({
    where: { key: BOOKING_AVAILABILITY_KEY },
    select: { value: true },
  });
  let timezone = parseBookingAvailabilityConfig(config?.value).timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    timezone = DEFAULT_REMINDER_TIMEZONE;
  }
  if (isStartInPast(booking.preferredDate, booking.preferredTime || "", timezone)) {
    return { error: "This appointment has already started. Change the date/time first.", status: 409 } as const;
  }
  const key = appointmentReminderKey(booking);
  if (!key) return { error: "Appointment date and time are required.", status: 400 } as const;

  return {
    booking,
    key,
    timezone,
    recordedConsent: bookingHasSmsConsent(booking.notes),
    message: appointmentReminderBody(booking, timezone, "manual"),
  };
}

export async function GET(request: NextRequest, context: Context) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner access required." }, { status: 403 });

  try {
    const { id } = await context.params;
    const result = await getReminderDetails(id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const claim = await prisma.siteContent.findUnique({ where: { key: result.key }, select: { value: true } });
    return NextResponse.json({
      customerName: result.booking.customerName,
      customerPhone: result.booking.customerPhone,
      message: result.message,
      recordedConsent: result.recordedConsent,
      alreadyScheduledOrSent: Boolean(claim),
      priorStatus: claim?.value?.startsWith("sent:") || claim?.value?.startsWith("manual:sent:") ? "sent" : claim ? "processing" : null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Booking manual reminder preview failed:", error);
    return NextResponse.json({ error: "Could not prepare the reminder preview." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner access required." }, { status: 403 });

  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const payload = await request.json().catch(() => ({}));
    if (payload.confirmSend !== true) {
      return NextResponse.json({ error: "Please review and confirm the reminder before texting." }, { status: 400 });
    }

    const details = await getReminderDetails(id);
    if ("error" in details) return NextResponse.json({ error: details.error }, { status: details.status });
    // For manually created appointments without website opt-in, allow only a
    // one-off reminder after the owner explicitly confirms existing permission.
    // This does NOT opt the customer into future automated reminders.
    if (!details.recordedConsent && payload.confirmSmsPermission !== true) {
      return NextResponse.json({
        error: "No SMS consent was recorded for this booking. Confirm the customer gave permission for this one reminder.",
      }, { status: 400 });
    }

    // The cron uses this exact unique key. Whichever route claims it first
    // wins: no duplicate manual SMS and no second automatic reminder later.
    try {
      await prisma.siteContent.create({ data: { key: details.key, value: "manual:claimed" } });
    } catch (error) {
      if (uniqueConstraint(error)) {
        return NextResponse.json({
          alreadyScheduledOrSent: true,
          error: "A reminder for this appointment is already sent or being processed. No duplicate SMS was sent.",
        }, { status: 409 });
      }
      throw error;
    }

    let acceptedByProvider = false;
    try {
      // Re-read after taking the claim, so a cancelled or rescheduled booking
      // cannot receive a reminder for the old appointment.
      const current = await getReminderDetails(id);
      if (
        "error" in current || current.key !== details.key ||
        normalizePhoneNumber(current.booking.customerPhone) !== normalizePhoneNumber(details.booking.customerPhone)
      ) {
        await prisma.siteContent.delete({ where: { key: details.key } });
        return NextResponse.json({
          error: "This booking was changed. Refresh it before sending the reminder.",
        }, { status: 409 });
      }
      const sms = await sendCustomerSmsWithHistory({
        to: current.booking.customerPhone,
        body: current.message,
      });
      if (!sms.sent || !sms.sid) {
        await prisma.siteContent.delete({ where: { key: details.key } });
        return NextResponse.json({ error: "Twilio did not accept the reminder SMS. You can try again." }, { status: 502 });
      }
      acceptedByProvider = true;
      // Never release the claim after Twilio accepted a send, even if history
      // recording fails: that would risk texting the same customer twice.
      try {
        await prisma.siteContent.update({
          where: { key: details.key },
          data: { value: `manual:sent:${sms.sid}` },
        });
        const conversation = await ensureBookingConversation(id);
        await prisma.bookingMessage.upsert({
          where: { externalSid: sms.sid },
          update: {},
          create: {
            conversationId: conversation.id,
            sender: "team",
            channel: "sms",
            externalSid: sms.sid,
            body: `${current.message}\nReply STOP to opt out or HELP for help.`,
          },
        });
        await prisma.bookingConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      } catch (historyError) {
        console.error("Reminder SMS accepted but history logging failed:", historyError);
      }
      return NextResponse.json({
        success: true,
        message: "Reminder SMS submitted to Twilio.",
        automaticReminderReplaced: true,
      });
    } catch (sendError) {
      if (!acceptedByProvider) {
        await prisma.siteContent.delete({ where: { key: details.key } }).catch((releaseError) => {
          console.error("Could not release manual reminder claim:", releaseError);
        });
      }
      throw sendError;
    }
  } catch (error) {
    console.error("Booking manual reminder failed:", error);
    return NextResponse.json({ error: "Could not send the reminder. Check message history before retrying." }, { status: 500 });
  }
}
