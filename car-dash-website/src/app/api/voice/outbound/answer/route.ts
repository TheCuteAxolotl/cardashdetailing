import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
import { formDataToRecord, validateTwilioVoiceWebhook } from "@/lib/twilio-voice";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = new twilio.twiml.VoiceResponse();
  try {
    const form = await request.formData();
    const params = formDataToRecord(form);
    if (!validateTwilioVoiceWebhook(request, params)) {
      response.hangup();
      return xml(response, 403);
    }

    const customerNumber = normalizePhoneNumber(request.nextUrl.searchParams.get("to"));
    if (!customerNumber || !customerNumber.startsWith("+1")) {
      response.hangup();
      return xml(response, 400);
    }

    const action = new URL("/api/voice/outbound/connect", getPublicSiteUrl());
    action.searchParams.set("to", customerNumber);
    const gather = response.gather({
      action: action.toString(),
      method: "POST",
      numDigits: 1,
      timeout: 10,
    });
    gather.say(
      { voice: "alice" },
      "This is Car Dash Detailing. Press 1 to connect to the customer. If you did not start this call, hang up now."
    );
    response.hangup();
    return xml(response);
  } catch (error) {
    console.error("Outbound call answer webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}

function xml(response: { toString(): string }, status = 200) {
  return new NextResponse(response.toString(), {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
