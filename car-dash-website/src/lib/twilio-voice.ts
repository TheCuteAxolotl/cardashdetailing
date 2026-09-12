import twilio from "twilio";
import type { NextRequest } from "next/server";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
const voiceNumberRaw = process.env.TWILIO_VOICE_NUMBER?.trim() || "";
const forwardToRaw = process.env.TWILIO_FORWARD_TO_NUMBER?.trim() || "";

export const voiceNumber = normalizePhoneNumber(voiceNumberRaw);
export const forwardToNumber = normalizePhoneNumber(forwardToRaw);

export const twilioVoiceRuntimeInfo = {
  accountSidConfigured: Boolean(accountSid),
  authTokenConfigured: Boolean(authToken),
  voiceNumberConfigured: Boolean(voiceNumber),
  forwardNumberConfigured: Boolean(forwardToNumber),
  configured: Boolean(accountSid && authToken && voiceNumber && forwardToNumber),
};

function basicAuthHeader() {
  if (!accountSid || !authToken) return null;
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export function getInboundVoiceWebhookUrl() {
  return (process.env.TWILIO_VOICE_WEBHOOK_URL || `${getPublicSiteUrl()}/api/voice/inbound`).trim();
}

export function maskPhoneNumber(value: string | null | undefined) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  return `••• ••• ${digits.slice(-4)}`;
}

export function formDataToRecord(form: FormData) {
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }
  return params;
}

export function validateTwilioVoiceWebhook(
  request: NextRequest,
  params: Record<string, string>,
  expectedUrl?: string
) {
  const signature = request.headers.get("x-twilio-signature");
  if (!signature || !authToken) return false;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const forwardedUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}${request.nextUrl.search}`
    : "";
  const hostUrl = host
    ? `${forwardedProto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
    : "";

  const candidates = Array.from(
    new Set([expectedUrl || "", request.url, forwardedUrl, hostUrl].filter(Boolean))
  );

  return candidates.some((url) => {
    try {
      return twilio.validateRequest(authToken, signature, url, params);
    } catch {
      return false;
    }
  });
}

type IncomingPhoneNumberRecord = {
  sid?: string;
  phone_number?: string;
  voice_url?: string;
  voice_method?: string;
  capabilities?: { voice?: boolean };
};

async function findConfiguredIncomingPhoneNumber() {
  const auth = basicAuthHeader();
  if (!auth || !accountSid || !voiceNumber) {
    return {
      ok: false as const,
      error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VOICE_NUMBER must be configured.",
    };
  }

  try {
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/IncomingPhoneNumbers.json`
    );
    url.searchParams.set("PhoneNumber", voiceNumber);
    url.searchParams.set("PageSize", "20");

    const response = await fetch(url, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false as const,
        error:
          typeof payload?.message === "string"
            ? payload.message
            : `Twilio returned ${response.status}.`,
      };
    }

    const rows: IncomingPhoneNumberRecord[] = Array.isArray(payload?.incoming_phone_numbers)
      ? payload.incoming_phone_numbers
      : [];
    const exact = rows.find(
      (row) => normalizePhoneNumber(row.phone_number) === voiceNumber && row.sid
    );

    if (!exact?.sid) {
      return {
        ok: false as const,
        error: `Could not find ${voiceNumber} in this Twilio account's incoming phone numbers.`,
      };
    }

    if (exact.capabilities?.voice === false) {
      return {
        ok: false as const,
        error: `${voiceNumber} does not have Twilio Voice capability. Use a voice-capable Twilio number.`,
      };
    }

    return { ok: true as const, number: exact };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not read the Twilio phone number configuration.",
    };
  }
}

export async function getVoiceConnectionStatus() {
  const expectedUrl = getInboundVoiceWebhookUrl();
  const lookup = await findConfiguredIncomingPhoneNumber();

  if (!lookup.ok) {
    return {
      ok: false as const,
      healthy: false,
      expectedUrl,
      businessNumber: voiceNumber,
      forwardNumberMasked: maskPhoneNumber(forwardToNumber),
      runtime: twilioVoiceRuntimeInfo,
      error: lookup.error,
    };
  }

  const inbound = lookup.number;
  const voiceUrl = String(inbound.voice_url || "");
  const voiceMethod = String(inbound.voice_method || "").toUpperCase();
  const healthy =
    voiceUrl.replace(/\/$/, "") === expectedUrl.replace(/\/$/, "") &&
    voiceMethod === "POST" &&
    Boolean(forwardToNumber);

  return {
    ok: true as const,
    healthy,
    expectedUrl,
    currentUrl: voiceUrl,
    currentMethod: voiceMethod,
    businessNumber: voiceNumber,
    forwardNumberMasked: maskPhoneNumber(forwardToNumber),
    runtime: twilioVoiceRuntimeInfo,
  };
}

export async function repairVoiceConnection() {
  const expectedUrl = getInboundVoiceWebhookUrl();
  const auth = basicAuthHeader();
  const lookup = await findConfiguredIncomingPhoneNumber();

  if (!auth || !accountSid || !lookup.ok) {
    return {
      ok: false as const,
      expectedUrl,
      error: lookup.ok ? "Twilio credentials are not configured." : lookup.error,
    };
  }

  if (!forwardToNumber) {
    return {
      ok: false as const,
      expectedUrl,
      error: "TWILIO_FORWARD_TO_NUMBER is not configured with the phone that should receive Car Dash calls.",
    };
  }

  try {
    const body = new URLSearchParams();
    body.set("VoiceUrl", expectedUrl);
    body.set("VoiceMethod", "POST");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/IncomingPhoneNumbers/${encodeURIComponent(String(lookup.number.sid))}.json`,
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
        error:
          typeof payload?.message === "string"
            ? payload.message
            : `Twilio returned ${response.status}.`,
      };
    }

    return {
      ok: true as const,
      healthy: true,
      expectedUrl,
      businessNumber: voiceNumber,
      forwardNumberMasked: maskPhoneNumber(forwardToNumber),
    };
  } catch (error) {
    return {
      ok: false as const,
      expectedUrl,
      error: error instanceof Error ? error.message : "Could not update the Twilio voice webhook.",
    };
  }
}
