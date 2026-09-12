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
    const accepted = String(params.Digits || "") === "1";

    if (callSid) {
      await prisma.callLog.updateMany({
        where: { callSid },
        data: {
          screenAccepted: accepted,
          status: accepted ? "connected" : "screen-declined",
        },
      });
    }

    if (!accepted) {
      response.hangup();
      return xml(response);
    }

    response.say({ voice: "alice" }, "Connecting Car Dash call.");
    return xml(response);
  } catch (error) {
    console.error("Voice screening decision failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
