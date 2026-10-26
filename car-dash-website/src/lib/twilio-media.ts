// Media URLs and credentials stay on the server. Never accept an arbitrary fetch URL.
function mediaRequest(messageSid: string, suffix: string) {
  const account = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!account || !token) throw new Error("SMS credentials unavailable");
  if (!/^(SM|MM)[a-f0-9]{32}$/i.test(messageSid)) throw new Error("Invalid message");
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${messageSid}/Media${suffix}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    // Fetch strips Authorization on a cross-origin redirect to Twilio's signed CDN.
    redirect: "follow",
  });
}

export async function listSmsMedia(messageSid: string): Promise<{ sid: string; contentType: string }[]> {
  const response = await mediaRequest(messageSid, ".json?PageSize=100");
  if (!response.ok) throw new Error("Media lookup failed");
  const data = await response.json();
  if (!Array.isArray(data.media_list)) throw new Error("Invalid media response");
  return data.media_list.filter((item: { sid?: string }) => /^ME[a-f0-9]{32}$/i.test(item.sid || ""))
    .map((item: { sid: string; content_type: string }) => ({ sid: item.sid, contentType: item.content_type || "application/octet-stream" }));
}

export async function fetchSmsMedia(messageSid: string, mediaSid: string) {
  if (!/^ME[a-f0-9]{32}$/i.test(mediaSid)) throw new Error("Invalid attachment");
  // The message-scoped Twilio resource also enforces attachment ownership.
  const response = await mediaRequest(messageSid, `/${mediaSid}`);
  if (!response.ok) throw new Error("Media unavailable");
  return response;
}
