import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { ensureGuestQuoteSupport } from "@/lib/quote-guest";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!hasStaffPermission(auth, "smsInbox")) {
    return NextResponse.json({ error: "No access." }, { status: 403 });
  }
  const phone = normalizePhoneNumber(request.nextUrl.searchParams.get("phone") || "");
  if (!phone) return NextResponse.json({ error: "Invalid phone." }, { status: 400 });

  await Promise.all([ensureBookingChatSchema(), ensureGuestQuoteSupport()]);
  const canBook = hasStaffPermission(auth, "bookings");
  const canQuote = hasStaffPermission(auth, "quoteChats");

  // Join by normalized number rather than booking/quote IDs. Existing historical
  // records stay intact and new bookings cannot fragment the customer timeline.
  const [bookingContacts, quoteContacts, direct] = await Promise.all([
    canBook ? prisma.booking.findMany({
      select: { id: true, customerPhone: true, serviceName: true, status: true },
    }) : [],
    canQuote ? prisma.quoteThread.findMany({
      select: { id: true, guestPhone: true, subject: true, status: true },
    }) : [],
    prisma.unmatchedSmsMessage.findMany({
      where: { OR: [
        { direction: "inbound", fromPhone: phone },
        { direction: "outbound", toPhone: phone },
      ] },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const matches = bookingContacts.filter(row => normalizePhoneNumber(row.customerPhone) === phone);
  const quotes = quoteContacts.filter(row => normalizePhoneNumber(row.guestPhone) === phone);
  const [bookingConversations, quoteMessages] = await Promise.all([
    matches.length
      ? prisma.bookingConversation.findMany({
          where: { bookingId: { in: matches.map(row => row.id) } },
          select: { bookingId: true, messages: { orderBy: { createdAt: "asc" } } },
        })
      : [],
    quotes.length
      ? prisma.quoteMessage.findMany({
          where: { threadId: { in: quotes.map(row => row.id) } },
          orderBy: { createdAt: "asc" },
        })
      : [],
  ]);

  const bookingLabels = new Map(matches.map(row => [row.id, row.serviceName]));
  const quoteLabels = new Map(quotes.map(row => [row.id, row.subject]));
  const messages = [
    ...bookingConversations.flatMap(row => row.messages.map(message => ({
      ...message,
      id: `booking:${message.id}`,
      originalId: message.id,
      source: "booking" as const,
      sourceId: row.bookingId,
      context: bookingLabels.get(row.bookingId) || "Booking",
    }))),
    ...quoteMessages.map(message => ({
      ...message,
      id: `quote:${message.id}`,
      originalId: message.id,
      source: "quote" as const,
      sourceId: message.threadId,
      context: quoteLabels.get(message.threadId) || "Quote",
    })),
    ...direct.map(message => ({
      ...message,
      id: `sms:${message.id}`,
      originalId: message.id,
      source: "sms" as const,
      sourceId: phone,
      context: message.fromPhone === "Car Dash automated" ? "Automated text" : "Direct text",
      sender: message.direction === "outbound" ? "team" : "customer",
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    || a.id.localeCompare(b.id));

  // External Twilio SIDs are unique delivery events, even if legacy integrations
  // accidentally wrote the same event into more than one source table.
  const seenSids = new Set<string>();
  const history = messages.filter(message => {
    if (!message.externalSid) return true;
    if (seenSids.has(message.externalSid)) return false;
    seenSids.add(message.externalSid);
    return true;
  });
  return NextResponse.json({ messages: history }, { headers: { "Cache-Control": "private, no-store" } });
}
