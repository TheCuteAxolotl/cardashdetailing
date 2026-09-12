import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
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

    const callSid = request.nextUrl.searchParams.get("callSid") || String(params.ParentCallSid || params.CallSid || "");
    const call = callSid ? await prisma.callLog.findUnique({ where: { callSid } }) : null;

    let callerLabel = "a customer";
    if (call?.fromPhone) {
      const normalized = normalizePhoneNumber(call.fromPhone);
      if (normalized) {
        const bookings = await prisma.booking.findMany({
          orderBy: { createdAt: "desc" },
          take: 500,
          select: { customerName: true, customerPhone: true },
        });
        const match = bookings.find((booking) => normalizePhoneNumber(booking.customerPhone) === normalized);
        if (match?.customerName?.trim()) callerLabel = match.customerName.trim().slice(0, 80);
      }
    }

    const decisionUrl = `${getPublicSiteUrl()}/api/voice/screen/decision${
      callSid ? `?callSid=${encodeURIComponent(callSid)}` : ""
    }`;

    const gather = response.gather({
      action: decisionUrl,
      method: "POST",
      numDigits: 1,
      timeout: 7,
    });
    gather.say(
      { voice: "alice" },
      `Car Dash Detailing call from ${callerLabel}. Press 1 to accept.`
    );

    // If a person does not press 1 (including personal voicemail answering),
    // end only the forwarded leg so the original caller can be sent to Car Dash voicemail.
    response.hangup();
    return xml(response);
  } catch (error) {
    console.error("Voice screening webhook failed:", error);
    response.hangup();
    return xml(response, 500);
  }
}
