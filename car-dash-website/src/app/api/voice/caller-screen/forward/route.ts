import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getPublicSiteUrl } from "@/lib/twilio-sms";
import {
  formDataToRecord,
  forwardToNumber,
  validateTwilioVoiceWebhook,
  voiceNumber,
} from "@/lib/twilio-voice";

export const runtime = "nodejs";

function xml(response: { toString(): string }, status = 200) {
  return new NextResponse(response.toString(), {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const response = new twilio.twiml.VoiceResponse();

  try {
    const form = await request.formData();
    const params = formDataToRecord(form);

    if (!validateTwilioVoiceWebhook(request, params)) {
      response.hangup();
      return xml(response, 403);
    }

    await ensureCallSystemSchema();

    const callSid = request.nextUrl.searchParams.get("callSid") || "";
    const call = callSid ? await prisma.callLog.findUnique({ where: { callSid } }) : null;

    // This endpoint must only be reachable after the caller passed the random challenge.
    if (!callSid || !call || call.status !== "caller-screen-passed") {
      response.hangup();
      return xml(response, 403);
    }

    if (!forwardToNumber) {
      response.say(
        { voice: "alice" },
        "Thanks for calling Car Dash Detailing. Our business phone is temporarily unavailable. Please send us a text and we will get back to you as soon as possible."
      );
      response.hangup();
      return xml(response);
    }

    const purpose = String(params.SpeechResult || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 160);

    await prisma.callLog.updateMany({
      where: { callSid },
      data: { status: "forwarding" },
    });

    const businessCallerId = call.toPhone || voiceNumber || undefined;
    const actionUrl = `${getPublicSiteUrl()}/api/voice/complete?callSid=${encodeURIComponent(callSid)}`;
    const purposeQuery = purpose ? `&purpose=${encodeURIComponent(purpose)}` : "";
    const screeningUrl = `${getPublicSiteUrl()}/api/voice/screen?callSid=${encodeURIComponent(callSid)}${purposeQuery}`;

    const dial = response.dial({
      action: actionUrl,
      method: "POST",
      timeout: 25,
      answerOnBridge: true,
      ...(businessCallerId ? { callerId: businessCallerId } : {}),
    });

    dial.number(
      {
        url: screeningUrl,
        method: "POST",
      },
      forwardToNumber
    );

    return xml(response);
  } catch (error) {
    console.error("Caller forwarding webhook failed:", error);
    response.say(
      { voice: "alice" },
      "We cannot connect your call right now. Please send Car Dash Detailing a text message instead."
    );
    response.hangup();
    return xml(response, 500);
  }
}
