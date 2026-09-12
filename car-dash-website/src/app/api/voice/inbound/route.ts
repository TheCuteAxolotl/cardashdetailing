import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
import {
  formDataToRecord,
  forwardToNumber,
  getInboundVoiceWebhookUrl,
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

    if (!validateTwilioVoiceWebhook(request, params, getInboundVoiceWebhookUrl())) {
      console.warn("Rejected inbound Voice webhook with an invalid Twilio signature.");
      response.reject({ reason: "rejected" });
      return xml(response, 403);
    }

    await ensureCallSystemSchema();

    const callSid = String(params.CallSid || "").trim();
    const rawFrom = String(params.From || "unknown").trim();
    const fromPhone = normalizePhoneNumber(rawFrom) || rawFrom.slice(0, 64);
    const toPhone = normalizePhoneNumber(params.To) || voiceNumber || null;

    const blockedCaller = normalizePhoneNumber(rawFrom)
      ? await prisma.blockedCaller.findUnique({ where: { phoneNumber: normalizePhoneNumber(rawFrom)! } })
      : null;

    if (callSid) {
      await prisma.callLog.upsert({
        where: { callSid },
        update: {
          fromPhone,
          toPhone,
          status: blockedCaller ? "blocked" : "forwarding",
          blocked: Boolean(blockedCaller),
        },
        create: {
          callSid,
          fromPhone,
          toPhone,
          status: blockedCaller ? "blocked" : "forwarding",
          blocked: Boolean(blockedCaller),
        },
      });
    }

    if (blockedCaller) {
      response.reject({ reason: "rejected" });
      return xml(response);
    }

    if (!forwardToNumber) {
      response.say(
        { voice: "alice" },
        "Thanks for calling Car Dash Detailing. Our business phone is temporarily unavailable. Please send us a text and we will get back to you as soon as possible."
      );
      response.hangup();
      return xml(response);
    }

    const businessCallerId = toPhone || voiceNumber || undefined;
    const actionUrl = `${getPublicSiteUrl()}/api/voice/complete${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;
    const screeningUrl = `${getPublicSiteUrl()}/api/voice/screen${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;

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
    console.error("Inbound Voice webhook failed:", error);
    response.say(
      { voice: "alice" },
      "Thanks for calling Car Dash Detailing. We cannot connect your call right now. Please send us a text and we will get back to you soon."
    );
    response.hangup();
    return xml(response, 500);
  }
}
