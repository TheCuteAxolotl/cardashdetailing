import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { fetchSmsMedia, listSmsMedia } from "@/lib/twilio-media";

export async function GET(request: NextRequest, context: { params: Promise<{ sid: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { sid } = await context.params;
  if (!/^(SM|MM)[a-f0-9]{32}$/i.test(sid)) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  // Only allow media belonging to a locally stored message in an authorized inbox.
  const permitted =
    (hasStaffPermission(auth, "smsInbox") && await prisma.unmatchedSmsMessage.findUnique({ where: { externalSid: sid }, select: { id: true } })) ||
    (hasStaffPermission(auth, "bookings") && await prisma.bookingMessage.findUnique({ where: { externalSid: sid }, select: { id: true } })) ||
    (hasStaffPermission(auth, "quoteChats") && await prisma.quoteMessage.findUnique({ where: { externalSid: sid }, select: { id: true } }));
  if (!permitted) return NextResponse.json({ error: "No access to this message" }, { status: 403 });
  try {
    const mediaSid = request.nextUrl.searchParams.get("media");
    if (!mediaSid) {
      const media = await listSmsMedia(sid);
      return NextResponse.json({ media: media.map(item => ({ ...item, url: `/api/sms/media/${sid}?media=${item.sid}` })) }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (!/^ME[a-f0-9]{32}$/i.test(mediaSid)) return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });
    const upstream = await fetchSmsMedia(sid, mediaSid);
    const type = (upstream.headers.get("content-type") || "application/octet-stream").split(";")[0].toLowerCase();
    const inline = /^(image\/(jpeg|png|gif|webp|avif)|video\/mp4|audio\/(mpeg|mp4|ogg|wav))$/.test(type);
    return new Response(upstream.body, { headers: {
      "Content-Type": type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="attachment-${mediaSid}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch {
    return NextResponse.json({ error: "Attachment unavailable. Please retry or ask the customer to resend it." }, { status: 502 });
  }
}
