import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { DELETED_MESSAGE } from "@/lib/deleted-message";

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Only the owner can delete messages." }, { status: 403 });
  if (request.headers.get("sec-fetch-site") === "cross-site" || (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { kind, id } = await request.json();
  if (!["quote", "booking", "sms"].includes(kind) || typeof id !== "string" || !id || id.length > 200) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }
  await ensureBookingChatSchema();
  const data = { body: DELETED_MESSAGE, attachmentsJson: null };
  // System entries include consent and booking metadata; they are not deletable chat messages.
  const result = kind === "quote"
    ? await prisma.quoteMessage.updateMany({ where: { id, sender: { not: "system" } }, data })
    : kind === "booking"
      ? await prisma.bookingMessage.updateMany({ where: { id, sender: { not: "system" } }, data })
      : await prisma.unmatchedSmsMessage.updateMany({ where: { id }, data });
  if (!result.count) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
