type QuoteDiscordPayload = {
  title: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message?: string;
  vehicle?: string;
  service?: string;
  photoCount?: number;
  threadId: string;
  quotedPrice?: number | null;
};

export async function notifyQuoteDiscord(data: QuoteDiscordPayload) {
  // Quote notifications intentionally use the SAME webhook as booking notifications.
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn("DISCORD_WEBHOOK_URL is missing; quote notification skipped.");
    return;
  }

  const lines = [
    `**${data.title}**`,
    `Customer: ${data.customerName || "Unknown"}`,
    `Email: ${data.customerEmail || "Not provided"}`,
    `Subject: ${data.subject || "Detailing quote"}`,
    data.vehicle ? `Vehicle: ${data.vehicle}` : null,
    data.service ? `Service: ${data.service}` : null,
    typeof data.quotedPrice === "number" ? `Quote: $${data.quotedPrice.toFixed(2)}` : null,
    data.message ? `Message: ${data.message.slice(0, 1000)}` : null,
    data.photoCount ? `Photos attached: ${data.photoCount}` : null,
    "",
    `Open quote inbox: https://cardashdetailing.com/owner/quotes?thread=${encodeURIComponent(data.threadId)}`,
  ].filter(Boolean);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Car Dash Detailing",
        content: lines.join("\n").slice(0, 1950),
      }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      console.error(
        "Discord quote notification failed:",
        response.status,
        response.statusText,
        responseText.slice(0, 500)
      );
    }
  } catch (error) {
    console.error("Discord quote notification failed:", error);
  }
}
