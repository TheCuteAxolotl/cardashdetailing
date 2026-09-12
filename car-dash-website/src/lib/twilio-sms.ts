import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || "";

export const twilioRuntimeInfo = {
  accountSidConfigured: Boolean(accountSid),
  authTokenConfigured: Boolean(authToken),
  messagingServiceConfigured: Boolean(messagingServiceSid),
  configured: Boolean(accountSid && authToken && messagingServiceSid),
};

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!twilioRuntimeInfo.configured) return null;
  if (!client) client = twilio(accountSid, authToken);
  return client;
}

export function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://cardashdetailing.com").replace(/\/$/, "");
}

export function getInboundSmsWebhookUrl() {
  return (process.env.TWILIO_INBOUND_WEBHOOK_URL || `${getPublicSiteUrl()}/api/sms/inbound`).trim();
}

export function validateTwilioWebhook(
  signature: string | null | undefined,
  url: string,
  params: Record<string, string>
) {
  if (!authToken || !signature || !url) return false;

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error("Twilio webhook validation failed:", error);
    return false;
  }
}

export function normalizePhoneNumber(raw: string | null | undefined) {
  const value = String(raw || "").trim();
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  // Allow already-international numbers with a reasonable E.164 length.
  if (value.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function isRecentlyActive(date: Date | string | null | undefined, windowMs = 90_000) {
  if (!date) return false;
  const timestamp = new Date(date).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp < windowMs;
}

export async function sendTransactionalSms(input: {
  to: string;
  body: string;
  includeOptOutLine?: boolean;
}) {
  const normalized = normalizePhoneNumber(input.to);
  if (!normalized) {
    console.warn("Twilio SMS skipped: invalid phone number.");
    return { sent: false, reason: "invalid_phone" as const };
  }

  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn("Twilio SMS skipped: environment variables are not fully configured.");
    return { sent: false, reason: "not_configured" as const };
  }

  const body = `${input.body.trim()}${input.includeOptOutLine === false ? "" : "\nReply STOP to opt out or HELP for help."}`;

  try {
    const message = await twilioClient.messages.create({
      to: normalized,
      messagingServiceSid,
      body,
    });

    return { sent: true, sid: message.sid };
  } catch (error) {
    // SMS must never break quote chats or bookings. Twilio errors are logged server-side instead.
    console.error("Twilio SMS send failed:", error);
    return { sent: false, reason: "twilio_error" as const };
  }
}
