import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { forwardToNumber, voiceNumber } from "@/lib/twilio-voice";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  if (!hasStaffPermission(account, "businessPhone")) {
    return NextResponse.json({ error: "Business Phone access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const customerNumber = normalizePhoneNumber(body?.phoneNumber);
  if (!customerNumber || !customerNumber.startsWith("+1")) {
    return NextResponse.json({ error: "Enter a valid U.S. or Canadian phone number." }, { status: 400 });
  }
  if (customerNumber === forwardToNumber || customerNumber === voiceNumber) {
    return NextResponse.json({ error: "Enter the customer's number, not a Car Dash number." }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken || !voiceNumber || !forwardToNumber) {
    return NextResponse.json({
      error: "Outbound calling needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VOICE_NUMBER, and TWILIO_FORWARD_TO_NUMBER configured.",
    }, { status: 503 });
  }

  try {
    const client = twilio(accountSid, authToken);
    const answerUrl = new URL("/api/voice/outbound/answer", getPublicSiteUrl());
    answerUrl.searchParams.set("to", customerNumber);

    const call = await client.calls.create({
      to: forwardToNumber,
      from: voiceNumber,
      url: answerUrl.toString(),
      method: "POST",
      timeout: 25,
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Your phone is ringing. Answer it and press 1 to connect to the customer.",
    });
  } catch (error) {
    console.error("Outbound Car Dash call failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Twilio could not start the call.",
    }, { status: 502 });
  }
}
