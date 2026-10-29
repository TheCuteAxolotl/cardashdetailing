import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission, isOwnerAccount } from "@/lib/permissions";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { ensureGuestQuoteSupport } from "@/lib/quote-guest";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

type Row = {
  kind: "quote" | "booking" | "sms";
  id: string;
  name: string;
  phone: string;
  subject: string;
  status: string;
  body: string;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  const sms = hasStaffPermission(auth, "smsInbox");
  const quotes = hasStaffPermission(auth, "quoteChats");
  const bookings = hasStaffPermission(auth, "bookings");
  if (!sms && !quotes && !bookings) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  await Promise.all([ensureBookingChatSchema(), ensureGuestQuoteSupport()]);

  const latest = { orderBy: { createdAt: "desc" as const }, take: 1, select: { body: true, createdAt: true } };
  const [bookingRows, quoteRows, directRows] = await Promise.all([
    bookings ? prisma.bookingConversation.findMany({
      where: { messages: { some: { sender: { in: ["customer", "team"] } } } },
      select: {
        booking: { select: { id: true, customerName: true, customerPhone: true, serviceName: true, status: true } },
        updatedAt: true,
        messages: latest,
      },
    }) : [],
    quotes ? prisma.quoteThread.findMany({
      select: {
        id: true, subject: true, status: true, guestName: true, guestPhone: true, updatedAt: true,
        user: { select: { name: true } }, messages: latest,
      },
    }) : [],
    sms ? prisma.unmatchedSmsMessage.findMany({
      orderBy: { createdAt: "desc" },
      select: { fromPhone: true, toPhone: true, direction: true, body: true, createdAt: true },
    }) : [],
  ]);
  const direct = new Map<string, typeof directRows[number]>();
  for (const message of directRows) {
    const phone = normalizePhoneNumber(message.direction === "outbound" ? message.toPhone || message.fromPhone : message.fromPhone);
    if (phone && !direct.has(phone)) direct.set(phone, message);
  }

  const rows: Row[] = [
    ...bookingRows.map(row => ({
      kind: "booking" as const, id: row.booking.id, name: row.booking.customerName,
      phone: row.booking.customerPhone, subject: row.booking.serviceName, status: row.booking.status,
      body: row.messages[0]?.body || "", updatedAt: row.messages[0]?.createdAt || row.updatedAt,
    })),
    ...quoteRows.map(row => ({
      kind: "quote" as const, id: row.id, name: row.user?.name || row.guestName || "Customer",
      phone: row.guestPhone || "", subject: row.subject, status: row.status,
      body: row.messages[0]?.body || "", updatedAt: row.messages[0]?.createdAt || row.updatedAt,
    })),
    ...Array.from(direct, ([phone, message]) => ({
      kind: "sms" as const, id: phone, name: phone, phone, subject: "Direct text",
      status: "", body: message.body, updatedAt: message.createdAt,
    })),
  ];

  // SMS-capable staff see one persistent thread per customer phone across bookings,
  // quotes and direct texts. Staff without SMS permission retain their original views.
  const grouped = new Map<string, Row>();
  const conversations: Row[] = [];
  for (const row of rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())) {
    const phone = sms ? normalizePhoneNumber(row.phone) : null;
    if (!phone) {
      conversations.push(row);
      continue;
    }
    if (!grouped.has(phone)) {
      const matchingBooking = rows
        .filter(item => item.kind === "booking" && normalizePhoneNumber(item.phone) === phone)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const matchingQuote = rows
        .filter(item => item.kind === "quote" && normalizePhoneNumber(item.phone) === phone)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const bestName = [matchingBooking?.name, matchingQuote?.name, row.name]
        .find(name => name && name !== phone && name !== "Customer") || phone;
      const item: Row = {
        ...row, kind: "sms", id: phone, phone, name: bestName,
        subject: matchingBooking?.subject || matchingQuote?.subject || "Customer conversation",
        status: "",
      };
      grouped.set(phone, item);
      conversations.push(item);
    }
  }

  return NextResponse.json({
    conversations,
    owner: isOwnerAccount(auth),
    canSms: sms,
    canBook: bookings,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
