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

    const querySid = request.nextUrl.searchParams.get("callSid") || "";
    const callSid = String(params.CallSid || querySid).trim();
    const dialStatus = String(params.DialCallStatus || "completed").trim().toLowerCase();
    const dialCallSid = String(params.DialCallSid || "").trim() || null;
    const duration = Number.parseInt(String(params.DialCallDuration || ""), 10);

    const call = callSid
      ? await prisma.callLog.findUnique({ where: { callSid } })
      : null;

    if (callSid) {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          status: call?.screenAccepted ? dialStatus || "completed" : "voicemail",
          dialCallSid,
          durationSeconds: Number.isFinite(duration) ? duration : null,
          endedAt: call?.screenAccepted ? new Date() : null,
        },
      });
    }

    if (call?.screenAccepted) {
      response.hangup();
      return xml(response);
    }

    const voicemailAction = `${getPublicSiteUrl()}/api/voice/voicemail/complete${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;
    const voicemailStatus = `${getPublicSiteUrl()}/api/voice/voicemail/status${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;

    response.say(
      { voice: "alice" },
      "Thanks for calling Car Dash Detailing. We are unable to answer right now. Please leave your name, your vehicle, and the service you are interested in after the beep. Press pound when you are finished."
    );
    response.record({
      action: voicemailAction,
      method: "POST",
      maxLength: 120,
      finishOnKey: "#",
      playBeep: true,
      trim: "trim-silence",
      recordingStatusCallback: voicemailStatus,
      recordingStatusCallbackMethod: "POST",
    });

    return xml(response);
  } catch (error) {
    console.error("Voice completion webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
