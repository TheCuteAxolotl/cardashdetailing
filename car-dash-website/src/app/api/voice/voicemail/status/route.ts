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
      return xml(response, 403);
    }

    await ensureCallSystemSchema();
    const callSid = request.nextUrl.searchParams.get("callSid") || "";
    const recordingSid = String(params.RecordingSid || "").trim() || null;
    const recordingUrl = String(params.RecordingUrl || "").trim() || null;
    const recordingStatus = String(params.RecordingStatus || "").trim().toLowerCase();
    const duration = Number.parseInt(String(params.RecordingDuration || ""), 10);

    if (callSid && recordingStatus === "completed") {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          status: "voicemail",
          voicemailRecordingSid: recordingSid,
          voicemailRecordingUrl: recordingUrl,
          voicemailDurationSeconds: Number.isFinite(duration) ? duration : null,
          voicemailAt: new Date(),
          endedAt: new Date(),
        },
      });
    }

    return xml(response);
  } catch (error) {
    console.error("Voicemail status webhook failed:", error);
    return xml(response, 500);
  }
}
