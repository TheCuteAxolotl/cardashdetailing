import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
import { forwardToNumber, voiceNumber } from "@/lib/twilio-voice";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!isOwnerAccount(auth)) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    await ensureCallSystemSchema();
    const blocked = await prisma.blockedCaller.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ blocked });
  } catch (error) {
    console.error("Blocked callers load failed:", error);
    return NextResponse.json({ error: "Could not load blocked callers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!isOwnerAccount(auth)) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    await ensureCallSystemSchema();
    const body = await request.json().catch(() => ({}));
    const phoneNumber = normalizePhoneNumber(body?.phoneNumber);
    const reason = String(body?.reason || "").trim().slice(0, 300) || null;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }
    if (phoneNumber === voiceNumber || phoneNumber === forwardToNumber) {
      return NextResponse.json({ error: "You cannot block the Car Dash number or its forwarding number." }, { status: 400 });
    }

    const blocked = await prisma.blockedCaller.upsert({
      where: { phoneNumber },
      update: { reason },
      create: { phoneNumber, reason },
    });

    return NextResponse.json({ success: true, blocked });
  } catch (error) {
    console.error("Block caller failed:", error);
    return NextResponse.json({ error: "Could not block that caller." }, { status: 500 });
  }
}
