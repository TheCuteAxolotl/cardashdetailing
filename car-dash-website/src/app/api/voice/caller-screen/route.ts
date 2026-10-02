import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getPublicSiteUrl } from "@/lib/twilio-sms";
import { formDataToRecord, validateTwilioVoiceWebhook } from "@/lib/twilio-voice";

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
    const expectedDigit = request.nextUrl.searchParams.get("expected") || "";
    const enteredDigit = String(params.Digits || "").trim();
    const passed = /^[2-9]$/.test(expectedDigit) && enteredDigit === expectedDigit;

    if (callSid) {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          status: passed ? "caller-screen-passed" : "caller-screen-failed",
          endedAt: passed ? null : new Date(),
        },
      });
    }

    if (!passed) {
      response.say(
        { voice: "alice" },
        "We could not verify this call. Please send Car Dash Detailing a text message instead."
      );
      response.hangup();
      return xml(response);
    }

    const forwardUrl = `${getPublicSiteUrl()}/api/voice/caller-screen/forward${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;

    const gather = response.gather({
      action: forwardUrl,
      method: "POST",
      input: "speech",
      timeout: 5,
      speechTimeout: "auto",
      actionOnEmptyResult: true,
    });
    gather.say(
      { voice: "alice" },
      "Thanks. Briefly tell us what service you are calling about."
    );

    return xml(response);
  } catch (error) {
    console.error("Caller screening webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
