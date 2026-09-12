import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  await ensureCallSystemSchema();
  const { id } = await context.params;
  const call = await prisma.callLog.findUnique({ where: { id } });
  if (!call?.voicemailRecordingSid) {
    return NextResponse.json({ error: "Voicemail recording is not available yet." }, { status: 404 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio credentials are not configured." }, { status: 503 });
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Recordings/${encodeURIComponent(call.voicemailRecordingSid)}.mp3`;
  const upstream = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not load voicemail audio." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
