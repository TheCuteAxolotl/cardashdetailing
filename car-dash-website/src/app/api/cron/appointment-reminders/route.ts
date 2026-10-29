import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOKING_AVAILABILITY_KEY, parseBookingAvailabilityConfig } from "@/lib/booking-availability";
import { bookingHasSmsConsent, ensureBookingConversation } from "@/lib/booking-chat";
import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
import {
  appointmentReminderBody,
  DEFAULT_REMINDER_TIMEZONE,
  isDueForReminder,
  reminderDateCandidates,
} from "@/lib/detail-appointment-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

/**
 * Vercel Cron runs every five minutes. Each due confirmed booking with explicit
 * website SMS consent gets ONE SMS for that date/time, even when cron overlaps.
 * This never confirms pending quote requests or manual bookings lacking consent.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
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

    const candidates = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        preferredDate: { in: reminderDateCandidates(now, timezone) },
      },
      orderBy: { preferredTime: "asc" },
    });

    const totals = { candidates: candidates.length, sent: 0, skipped: 0, failed: 0 };

    for (const candidate of candidates) {
      if (
        !isDueForReminder(candidate, now, timezone) ||
        !bookingHasSmsConsent(candidate.notes) ||
        !normalizePhoneNumber(candidate.customerPhone)
      ) {
        totals.skipped++;
        continue;
      }

      // Lock each appointment date/time before contacting Twilio. The unique
      // SiteContent key prevents parallel cron runs from texting twice.
      const key = `detail-reminder:2h:${candidate.id}:${candidate.preferredDate}:${candidate.preferredTime}`;
      try {
        await prisma.siteContent.create({ data: { key, value: "claimed" } });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          totals.skipped++;
          continue;
        }
        throw error;
      }

      let messageSent = false;
      try {
        // Edits/cancellations may occur between listing and claiming a reminder.
        const booking = await prisma.booking.findUnique({ where: { id: candidate.id } });
        if (
          !booking ||
          !isDueForReminder(booking, new Date(), timezone) ||
          !bookingHasSmsConsent(booking.notes) ||
          !normalizePhoneNumber(booking.customerPhone) ||
          booking.preferredDate !== candidate.preferredDate ||
          booking.preferredTime !== candidate.preferredTime
        ) {
          totals.skipped++;
          await prisma.siteContent.delete({ where: { key } });
          continue;
        }

        const body = appointmentReminderBody(booking, timezone);
        const sent = await sendCustomerSmsWithHistory({ to: booking.customerPhone, body });
        if (!sent.sent || !sent.sid) {
          totals.failed++;
          await prisma.siteContent.delete({ where: { key } });
          continue;
        }
        messageSent = true;
        // Keep the lock if a DB write fails after Twilio has accepted the text:
        // sending another message is worse than a missing history row.
        try {
          await prisma.siteContent.update({
            where: { key },
            data: { value: `sent:${sent.sid}` },
          });
          const conversation = await ensureBookingConversation(booking.id);
          await prisma.bookingMessage.upsert({
            where: { externalSid: sent.sid },
            update: {},
            create: {
              conversationId: conversation.id,
              sender: "team",
              body: `${body}\nReply STOP to opt out or HELP for help.`,
              channel: "sms",
              externalSid: sent.sid,
            },
          });
          await prisma.bookingConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
        } catch (historyError) {
          console.error("Appointment reminder sent but booking chat history failed:", historyError);
        }
        totals.sent++;
      } catch (error) {
        console.error("Appointment reminder failed:", candidate.id, error);
        totals.failed++;
        // Only release a lock when no SMS was accepted by Twilio.
        if (!messageSent) {
          await prisma.siteContent.delete({ where: { key } }).catch((releaseError) => {
            console.error("Could not release appointment reminder lock:", releaseError);
          });
        }
      }
    }

    return NextResponse.json(totals, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Appointment reminder cron error:", error);
    return NextResponse.json({ error: "Could not process appointment reminders." }, { status: 500 });
  }
}
