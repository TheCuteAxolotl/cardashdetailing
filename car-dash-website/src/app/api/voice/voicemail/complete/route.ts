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
    const callSid = request.nextUrl.searchParams.get("callSid") || "";
    const recordingUrl = String(params.RecordingUrl || "").trim() || null;
    const duration = Number.parseInt(String(params.RecordingDuration || ""), 10);

    if (callSid) {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          status: recordingUrl ? "voicemail" : "missed",
          voicemailRecordingUrl: recordingUrl,
          voicemailDurationSeconds: Number.isFinite(duration) ? duration : null,
          voicemailAt: recordingUrl ? new Date() : null,
          endedAt: new Date(),
        },
      });
    }

    response.say({ voice: "alice" }, "Thank you. Your message has been received. Car Dash Detailing will get back to you soon.");
    response.hangup();
    return xml(response);
  } catch (error) {
    console.error("Voicemail completion webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
