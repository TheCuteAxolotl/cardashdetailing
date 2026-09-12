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

function twilioBasicAuthHeader() {
  if (!accountSid || !authToken) return null;
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
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

type TwilioHistoryMessage = {
  sid?: string;
  body?: string;
  direction?: string;
  from?: string;
  to?: string;
  date_sent?: string | null;
  date_created?: string | null;
  num_media?: string | null;
};

export async function listRecentInboundSms(input: { since: Date; limit?: number }) {
  const auth = twilioBasicAuthHeader();
  if (!auth || !accountSid) {
    return { ok: false as const, error: "Twilio account credentials are not configured." };
  }

  try {
    const url = new URL(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`);
    url.searchParams.set("DateSent>", input.since.toISOString().slice(0, 10));
    url.searchParams.set("PageSize", String(Math.min(Math.max(input.limit || 250, 1), 1000)));

    const response = await fetch(url, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof payload?.message === "string" ? payload.message : `Twilio returned ${response.status}.`;
      return { ok: false as const, error: message };
    }

    const rawMessages: TwilioHistoryMessage[] = Array.isArray(payload?.messages) ? payload.messages : [];
    const messages = rawMessages
      .filter((message) => message.direction === "inbound" && message.sid && message.from)
      .map((message) => ({
        sid: String(message.sid),
        from: String(message.from),
        to: String(message.to || ""),
        body: String(message.body || ""),
        numMedia: Math.max(0, Number.parseInt(String(message.num_media || "0"), 10) || 0),
        dateSent: message.date_sent ? new Date(message.date_sent) : null,
        dateCreated: message.date_created ? new Date(message.date_created) : null,
      }));

    return { ok: true as const, messages };
  } catch (error) {
    console.error("Twilio inbound history sync failed:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not read inbound messages from Twilio.",
    };
  }
}

export async function getMessagingServiceInboundStatus() {
  const auth = twilioBasicAuthHeader();
  const expectedUrl = getInboundSmsWebhookUrl();

  if (!auth || !messagingServiceSid) {
    return {
      ok: false as const,
      expectedUrl,
      error: "Twilio Messaging Service credentials are not fully configured.",
    };
  }

  try {
    const response = await fetch(
      `https://messaging.twilio.com/v1/Services/${encodeURIComponent(messagingServiceSid)}`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false as const,
        expectedUrl,
        error: typeof payload?.message === "string" ? payload.message : `Twilio returned ${response.status}.`,
      };
    }

    const inboundRequestUrl = String(payload?.inbound_request_url || "");
    const inboundMethod = String(payload?.inbound_method || "").toUpperCase();
    const useInboundWebhookOnNumber = Boolean(payload?.use_inbound_webhook_on_number);
    const healthy =
      inboundRequestUrl.replace(/\/$/, "") === expectedUrl.replace(/\/$/, "") &&
      inboundMethod === "POST" &&
      !useInboundWebhookOnNumber;

    return {
      ok: true as const,
      healthy,
      expectedUrl,
      inboundRequestUrl,
      inboundMethod,
      useInboundWebhookOnNumber,
    };
  } catch (error) {
    return {
      ok: false as const,
      expectedUrl,
      error: error instanceof Error ? error.message : "Could not read the Twilio Messaging Service configuration.",
    };
  }
}

export async function repairMessagingServiceInboundWebhook() {
  const auth = twilioBasicAuthHeader();
  const expectedUrl = getInboundSmsWebhookUrl();

  if (!auth || !messagingServiceSid) {
    return {
      ok: false as const,
      expectedUrl,
      error: "Twilio Messaging Service credentials are not fully configured.",
    };
  }

  try {
    const body = new URLSearchParams();
    body.set("InboundRequestUrl", expectedUrl);
    body.set("InboundMethod", "POST");
    body.set("UseInboundWebhookOnNumber", "false");

    const response = await fetch(
      `https://messaging.twilio.com/v1/Services/${encodeURIComponent(messagingServiceSid)}`,
      {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
      }
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false as const,
        expectedUrl,
        error: typeof payload?.message === "string" ? payload.message : `Twilio returned ${response.status}.`,
      };
    }

    return {
      ok: true as const,
      healthy: true,
      expectedUrl,
      inboundRequestUrl: String(payload?.inbound_request_url || expectedUrl),
      inboundMethod: String(payload?.inbound_method || "POST").toUpperCase(),
      useInboundWebhookOnNumber: Boolean(payload?.use_inbound_webhook_on_number),
    };
  } catch (error) {
    return {
      ok: false as const,
      expectedUrl,
      error: error instanceof Error ? error.message : "Could not update the Twilio Messaging Service configuration.",
    };
  }
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
    console.error("Twilio SMS send failed:", error);
    return { sent: false, reason: "twilio_error" as const };
  }
}
