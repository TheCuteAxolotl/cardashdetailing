import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!hasStaffPermission(auth, "smsInbox")) return NextResponse.json({ error: "No access." }, { status: 403 });
  const phone = normalizePhoneNumber(request.nextUrl.searchParams.get("phone") || "");
  if (!phone) return NextResponse.json({ error: "Invalid phone." }, { status: 400 });
  await ensureBookingChatSchema();
  const messages = await prisma.unmatchedSmsMessage.findMany({
    where: { OR: [{ direction: "inbound", fromPhone: phone }, { direction: "outbound", toPhone: phone }] },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages: messages.map(message => ({ ...message, sender: message.direction === "outbound" ? "team" : "customer" })) }, { headers: { "Cache-Control": "private, no-store" } });
}
