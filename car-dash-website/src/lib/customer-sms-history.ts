import { prisma } from "@/lib/prisma";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { normalizePhoneNumber, sendTransactionalSms, listRecentOutboundSms } from "@/lib/twilio-sms";

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

// Import historical outgoing texts once, then refresh at most every four hours.
// This is supplementary: current automated sends are saved immediately above.
export async function syncCustomerOutboundHistory() {
  await ensureBookingChatSchema();
  const key = "car_dash_customer_outbound_sync_last_at";
  const marker = await prisma.siteContent.findUnique({ where: { key }, select: { value: true } });
  const last = Number(marker?.value || 0);
  if (last && Date.now() - last < 4 * 60 * 60 * 1000) {
    return { scanned: 0, imported: 0, skipped: true };
  }
  const since = new Date(Date.now() - (last ? 7 : 30) * 24 * 60 * 60 * 1000);
  const result = await listRecentOutboundSms({ since, limit: 500 });
  if (!result.ok) throw new Error(result.error || "Could not retrieve sent SMS history.");

  const incoming = result.messages.filter(row => {
    if (!row.sid || !normalizePhoneNumber(row.to)) return false;
    const body = row.body.trim();
    // Exclude one-time passwords, security challenges and sensitive sign-in codes.
    if (!body || /verification code|security code|one[- ]time (?:pass(?:word|code)|pin)|login code|sign[- ]in code|2fa|authentication code/i.test(body)) return false;
    return true;
  });
  const ids = incoming.map(row => row.sid);
  const [booking, quote, direct] = await Promise.all([
    prisma.bookingMessage.findMany({ where: { externalSid: { in: ids } }, select: { externalSid: true } }),
    prisma.quoteMessage.findMany({ where: { externalSid: { in: ids } }, select: { externalSid: true } }),
    prisma.unmatchedSmsMessage.findMany({ where: { externalSid: { in: ids } }, select: { externalSid: true } }),
  ]);
  const recorded = new Set([...booking, ...quote, ...direct].map(row => row.externalSid).filter(Boolean));
  const fresh = incoming.filter(row => !recorded.has(row.sid));
  if (fresh.length) {
    await prisma.unmatchedSmsMessage.createMany({
      data: fresh.map(row => ({
        externalSid: row.sid,
        fromPhone: "Car Dash imported SMS",
        toPhone: normalizePhoneNumber(row.to)!,
        direction: "outbound",
        body: row.body.slice(0, 3000),
        createdAt: row.dateSent && !Number.isNaN(row.dateSent.getTime()) ? row.dateSent
          : row.dateCreated && !Number.isNaN(row.dateCreated.getTime()) ? row.dateCreated : new Date(),
      })),
      skipDuplicates: true,
    });
  }
  await prisma.siteContent.upsert({
    where: { key },
    create: { key, value: String(Date.now()) },
    update: { value: String(Date.now()) },
  });
  return { scanned: incoming.length, imported: fresh.length, skipped: false };
}
