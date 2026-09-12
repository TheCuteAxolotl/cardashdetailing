import { prisma } from "@/lib/prisma";
import {
  ensureBookingConversation,
  ensureBookingChatSchema,
  notifyBookingChatDiscord,
} from "@/lib/booking-chat";
import { listRecentInboundSms, normalizePhoneNumber } from "@/lib/twilio-sms";

export type StoreInboundSmsInput = {
  from: string;
  to?: string | null;
  sid: string;
  body: string;
  mediaCount?: number;
  createdAt?: Date | null;
};

async function findBookingForPhone(phone: string) {
  const candidates = await prisma.booking.findMany({
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      serviceName: true,
      vehicleYear: true,
      vehicleMake: true,
      vehicleModel: true,
      vehicleTrim: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const matches = candidates.filter(
    (booking) => normalizePhoneNumber(booking.customerPhone) === phone
  );

  return (
    matches.find((booking) => booking.status === "confirmed") ||
    matches.find((booking) => booking.status === "pending") ||
    matches[0] ||
    null
  );
}

export async function storeInboundSms(input: StoreInboundSmsInput) {
  const fromPhone = normalizePhoneNumber(input.from);
  const messageSid = String(input.sid || "").trim();
  const rawBody = String(input.body || "").trim();
  const mediaCount = Math.max(0, Number(input.mediaCount || 0));
  const body = rawBody || (mediaCount > 0 ? "Customer sent an MMS attachment." : "");

  if (!fromPhone || !messageSid || !body) {
    return { stored: false, reason: "missing_fields" as const };
  }

  await ensureBookingChatSchema();

  const duplicateBookingMessage = await prisma.bookingMessage.findUnique({
    where: { externalSid: messageSid },
    select: { id: true },
  });
  if (duplicateBookingMessage) {
    return { stored: false, reason: "duplicate" as const };
  }

  const duplicateUnmatched = await prisma.unmatchedSmsMessage.findUnique({
    where: { externalSid: messageSid },
    select: { id: true },
  });
  if (duplicateUnmatched) {
    return { stored: false, reason: "duplicate" as const };
  }

  const booking = await findBookingForPhone(fromPhone);
  const createdAt = input.createdAt && !Number.isNaN(input.createdAt.getTime())
    ? input.createdAt
    : new Date();

  if (!booking) {
    await prisma.unmatchedSmsMessage.create({
      data: {
        fromPhone,
        toPhone: normalizePhoneNumber(input.to || "") || input.to || null,
        body: body.slice(0, 3000),
        externalSid: messageSid,
        createdAt,
      },
    });

    console.warn(`Inbound SMS from ${fromPhone} was saved as unmatched because no booking used that phone number.`);
    return { stored: true, matched: false as const };
  }

  const conversation = await ensureBookingConversation(booking.id);
  await prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      sender: "customer",
      body: body.slice(0, 3000),
      channel: "sms",
      externalSid: messageSid,
      createdAt,
    },
  });

  await prisma.bookingConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await notifyBookingChatDiscord({
    bookingId: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    serviceName: booking.serviceName,
    vehicle: [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
      .filter(Boolean)
      .join(" "),
    message: `SMS reply: ${body}`,
  });

  return { stored: true, matched: true as const, bookingId: booking.id };
}

export async function syncRecentInboundSmsFromTwilio(days = 7) {
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const result = await listRecentInboundSms({ since, limit: 250 });

  if (!result.ok) {
    return {
      ok: false as const,
      scanned: 0,
      stored: 0,
      matched: 0,
      unmatched: 0,
      error: result.error,
    };
  }

  let stored = 0;
  let matched = 0;
  let unmatched = 0;

  for (const message of result.messages) {
    const saved = await storeInboundSms({
      from: message.from,
      to: message.to,
      sid: message.sid,
      body: message.body,
      mediaCount: message.numMedia,
      createdAt: message.dateSent || message.dateCreated,
    });

    if (saved.stored) {
      stored += 1;
      if ("matched" in saved && saved.matched) matched += 1;
      if ("matched" in saved && saved.matched === false) unmatched += 1;
    }
  }

  return {
    ok: true as const,
    scanned: result.messages.length,
    stored,
    matched,
    unmatched,
  };
}
