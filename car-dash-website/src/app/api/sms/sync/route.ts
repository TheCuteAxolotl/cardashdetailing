import { NextRequest, NextResponse } from "next/server";
import { syncRecentInboundSmsFromTwilio } from "@/lib/inbound-sms";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "smsInbox")) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    const result = await syncRecentInboundSmsFromTwilio(7);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Could not sync Twilio replies." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, ...result, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("SMS history sync failed:", error);
    return NextResponse.json({ error: "Could not sync Twilio replies." }, { status: 500 });
  }
}
