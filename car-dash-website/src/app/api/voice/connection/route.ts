import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { getVoiceConnectionStatus, repairVoiceConnection } from "@/lib/twilio-voice";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const result = await getVoiceConnectionStatus();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const result = await repairVoiceConnection();
  if (!result.ok) {
    return NextResponse.json({ ...result, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ success: true, ...result });
}
