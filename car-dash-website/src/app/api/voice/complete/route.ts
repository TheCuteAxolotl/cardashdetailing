import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
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

    const querySid = request.nextUrl.searchParams.get("callSid") || "";
    const callSid = String(params.CallSid || querySid).trim();
    const dialStatus = String(params.DialCallStatus || "completed").trim().toLowerCase();
    const dialCallSid = String(params.DialCallSid || "").trim() || null;
    const duration = Number.parseInt(String(params.DialCallDuration || ""), 10);

    if (callSid) {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          status: dialStatus || "completed",
          dialCallSid,
          durationSeconds: Number.isFinite(duration) ? duration : null,
          endedAt: new Date(),
        },
      });
    }

    if (["busy", "no-answer", "failed", "canceled"].includes(dialStatus)) {
      response.say(
        { voice: "alice" },
        "Sorry we missed your call. Please send Car Dash Detailing a text at this same number and we will get back to you as soon as possible."
      );
    }

    response.hangup();
    return xml(response);
  } catch (error) {
    console.error("Voice completion webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
