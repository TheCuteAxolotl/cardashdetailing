import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
import {
  formDataToRecord,
  validateTwilioVoiceWebhook,
  voiceNumber,
} from "@/lib/twilio-voice";

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
    if (String(params.Digits || "") !== "1" || !customerNumber || !customerNumber.startsWith("+1") || !voiceNumber) {
      response.say({ voice: "alice" }, "The call was not connected.");
      response.hangup();
      return xml(response);
    }

    response.say({ voice: "alice" }, "Connecting you now.");
    const dial = response.dial({
      callerId: voiceNumber,
      answerOnBridge: true,
      timeout: 30,
    });
    dial.number(customerNumber);
    return xml(response);
  } catch (error) {
    console.error("Outbound call connection webhook failed:", error);
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
