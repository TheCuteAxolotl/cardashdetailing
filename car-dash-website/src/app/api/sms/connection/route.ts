import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest, isOwnerAccount, isStaffAccount } from "@/lib/permissions";
import {
  getMessagingServiceInboundStatus,
  repairMessagingServiceInboundWebhook,
  twilioRuntimeInfo,
} from "@/lib/twilio-sms";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isStaffAccount(auth)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  const status = await getMessagingServiceInboundStatus();
  return NextResponse.json({
    ...status,
    runtimeConfigured: twilioRuntimeInfo.configured,
    canRepair: isOwnerAccount(auth),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const result = await repairMessagingServiceInboundWebhook();
  if (!result.ok) {
    return NextResponse.json({ ...result, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, ...result });
}
