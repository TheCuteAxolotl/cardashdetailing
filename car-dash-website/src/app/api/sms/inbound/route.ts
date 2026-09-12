import { NextRequest, NextResponse } from "next/server";
import { storeInboundSms } from "@/lib/inbound-sms";
import {
  getInboundSmsWebhookUrl,
  validateTwilioWebhook,
} from "@/lib/twilio-sms";

export const runtime = "nodejs";

function twimlResponse(status = 200) {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function formDataToRecord(form: FormData) {
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }
  return params;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const params = formDataToRecord(form);
    const signature = request.headers.get("x-twilio-signature");
    const configuredWebhookUrl = getInboundSmsWebhookUrl();
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const forwardedUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}${request.nextUrl.search}`
      : "";
    const hostUrl = host
      ? `${forwardedProto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
      : "";
    const validationUrls = Array.from(
      new Set([configuredWebhookUrl, request.url, forwardedUrl, hostUrl].filter(Boolean))
    );

    const validRequest = validationUrls.some((url) =>
      validateTwilioWebhook(signature, url, params)
    );

    if (!validRequest) {
      console.warn("Rejected inbound SMS webhook with an invalid Twilio signature.", {
        requestUrl: request.url,
        configuredWebhookUrl,
        forwardedUrl,
      });
      return twimlResponse(403);
    }

    await storeInboundSms({
      from: params.From,
      to: params.To,
      sid: params.MessageSid,
      body: params.Body,
      mediaCount: Number.parseInt(params.NumMedia || "0", 10) || 0,
      createdAt: new Date(),
    });

    return twimlResponse();
  } catch (error) {
    console.error("Inbound SMS webhook failed:", error);
    return twimlResponse(500);
  }
}
