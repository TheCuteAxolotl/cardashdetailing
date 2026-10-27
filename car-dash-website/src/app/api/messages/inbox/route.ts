import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission, isOwnerAccount } from "@/lib/permissions";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { ensureGuestQuoteSupport } from "@/lib/quote-guest";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  const sms = hasStaffPermission(auth, "smsInbox"), quotes = hasStaffPermission(auth, "quoteChats"), bookings = hasStaffPermission(auth, "bookings");
  if (!sms && !quotes && !bookings) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  await Promise.all([ensureBookingChatSchema(), ensureGuestQuoteSupport()]);
  const latest = { orderBy: { createdAt: "desc" as const }, take: 1, select: { body: true, createdAt: true } };
  const [bookingRows, quoteRows, directRows] = await Promise.all([
    bookings ? prisma.bookingConversation.findMany({ where: { messages: { some: { sender: { in: ["customer", "team"] } } } }, select: { booking: { select: { id: true, customerName: true, customerPhone: true, serviceName: true, status: true } }, updatedAt: true, messages: latest } }) : [],
    quotes ? prisma.quoteThread.findMany({ select: { id: true, subject: true, status: true, guestName: true, guestPhone: true, updatedAt: true, user: { select: { name: true } }, messages: latest } }) : [],
    sms ? prisma.unmatchedSmsMessage.findMany({ orderBy: { createdAt: "desc" }, select: { fromPhone: true, toPhone: true, direction: true, body: true, createdAt: true } }) : [],
  ]);
  const direct = new Map<string, typeof directRows[number]>();
  for (const message of directRows) {
    const phone = message.direction === "outbound" ? message.toPhone || message.fromPhone : message.fromPhone;
    if (!direct.has(phone)) direct.set(phone, message);
  }
  const conversations = [
    ...bookingRows.map(row => ({ kind: "booking", id: row.booking.id, name: row.booking.customerName, phone: row.booking.customerPhone, subject: row.booking.serviceName, status: row.booking.status, body: row.messages[0]?.body || "", updatedAt: row.messages[0]?.createdAt || row.updatedAt })),
    ...quoteRows.map(row => ({ kind: "quote", id: row.id, name: row.user?.name || row.guestName || "Customer", phone: row.guestPhone || "", subject: row.subject, status: row.status, body: row.messages[0]?.body || "", updatedAt: row.messages[0]?.createdAt || row.updatedAt })),
    ...Array.from(direct, ([phone, message]) => ({ kind: "sms", id: phone, name: phone, phone, subject: "Direct text", status: "", body: message.body, updatedAt: message.createdAt })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return NextResponse.json({ conversations, owner: isOwnerAccount(auth), canSms: sms, canBook: bookings }, { headers: { "Cache-Control": "private, no-store" } });
}
