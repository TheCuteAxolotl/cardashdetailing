import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureBookingConversation,
  ensureBookingChatSchema,
  notifyBookingChatDiscord,
} from "@/lib/booking-chat";
import {
  getInboundSmsWebhookUrl,
  normalizePhoneNumber,
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

async function findBookingForPhone(phone: string) {
  // Booking phone numbers can be stored with spaces, parentheses, or dashes, so
  // compare normalized E.164 values instead of relying on exact database text.
  const candidates = await prisma.booking.findMany({
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      serviceName: true,
      vehicleYear: true,
      vehicleMake: true,
      vehicleModel: true,
      vehicleTrim: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const matches = candidates.filter(
    (booking) => normalizePhoneNumber(booking.customerPhone) === phone
  );

  // A reply is most likely about an active appointment. Fall back to the latest
  // booking for the phone if the customer replies after completion/cancellation.
  return (
    matches.find((booking) => booking.status === "confirmed") ||
    matches.find((booking) => booking.status === "pending") ||
    matches[0] ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const params = formDataToRecord(form);
    const signature = request.headers.get("x-twilio-signature");
    const configuredWebhookUrl = getInboundSmsWebhookUrl();
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const forwardedUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}`
      : "";
    const validationUrls = Array.from(
      new Set([configuredWebhookUrl, request.url, forwardedUrl].filter(Boolean))
    );

    const validRequest = validationUrls.some((url) =>
      validateTwilioWebhook(signature, url, params)
    );

    if (!validRequest) {
      console.warn("Rejected inbound SMS webhook with an invalid Twilio signature.");
      return twimlResponse(403);
    }

    const fromPhone = normalizePhoneNumber(params.From);
    const messageSid = String(params.MessageSid || "").trim();
    const rawBody = String(params.Body || "").trim();
    const mediaCount = Math.max(0, Number.parseInt(params.NumMedia || "0", 10) || 0);
    const body = rawBody || (mediaCount > 0 ? "Customer sent an MMS attachment." : "");

    if (!fromPhone || !messageSid || !body) {
      console.warn("Inbound SMS webhook skipped because required message fields were missing.");
      return twimlResponse();
    }

    await ensureBookingChatSchema();

    // Twilio can retry webhooks. MessageSid makes inbound messages idempotent.
    const duplicate = await prisma.bookingMessage.findUnique({
      where: { externalSid: messageSid },
      select: { id: true },
    });
    if (duplicate) return twimlResponse();

    const booking = await findBookingForPhone(fromPhone);
    if (!booking) {
      console.warn(`Inbound SMS from ${fromPhone} did not match a recent booking.`);
      return twimlResponse();
    }

    const conversation = await ensureBookingConversation(booking.id);
    await prisma.bookingMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "customer",
        body: body.slice(0, 3000),
        channel: "sms",
        externalSid: messageSid,
      },
    });

    await prisma.bookingConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    await notifyBookingChatDiscord({
      bookingId: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      serviceName: booking.serviceName,
      vehicle: [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
        .filter(Boolean)
        .join(" "),
      message: `SMS reply: ${body}`,
    });

    return twimlResponse();
  } catch (error) {
    console.error("Inbound SMS webhook failed:", error);
    // A 500 lets Twilio surface the webhook error in its debugger instead of silently dropping it.
    return twimlResponse(500);
  }
}
