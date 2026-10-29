import { prisma } from "@/lib/prisma";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { normalizePhoneNumber, sendTransactionalSms } from "@/lib/twilio-sms";

/**
 * Use for customer-facing transactional texts only (bookings, quote updates,
 * invoices and maintenance offers). NEVER use for login / verification codes.
 * History is one phone-number timeline even when the customer books repeatedly.
 */
export async function sendCustomerSmsWithHistory(input: {
  to: string;
  body: string;
  includeOptOutLine?: boolean;
  mediaUrls?: string[];
}) {
  const sent = await sendTransactionalSms(input);
  if (!sent.sent || !sent.sid) return sent;
  const phone = normalizePhoneNumber(input.to);
  if (!phone) return sent;

  try {
    await ensureBookingChatSchema();
    // Twilio SID is unique, so duplicate retries won't produce extra messages.
    await prisma.unmatchedSmsMessage.upsert({
      where: { externalSid: sent.sid },
      create: {
        fromPhone: "Car Dash automated",
        toPhone: phone,
        direction: "outbound",
        externalSid: sent.sid,
        body: (input.body.trim() + (input.includeOptOutLine === false ? "" : "\nReply STOP to opt out or HELP for help.")).slice(0, 3000),
      },
      update: {},
    });
  } catch (error) {
    // The SMS already went out. Do not falsely return a send failure or resend.
    console.error("Customer SMS delivered but history recording failed", error);
  }
  return sent;
}
