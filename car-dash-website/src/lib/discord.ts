type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

function clean(value: string | null | undefined, max = 1000) {
  const text = String(value || "").trim();
  return (text || "Not provided").slice(0, max);
}

export async function sendDiscordEmbed(options: {
  webhookUrl?: string;
  title: string;
  description?: string;
  fields: DiscordField[];
  footer?: string;
}) {
  const webhookUrl = options.webhookUrl?.trim();
  if (!webhookUrl) return false;

  try {
    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Car Dash Detailing",
        embeds: [
          {
            title: clean(options.title, 250),
            description: options.description ? clean(options.description, 2000) : undefined,
            color: 14423100,
            fields: options.fields.map((field) => ({
              name: clean(field.name, 250),
              value: clean(field.value, 1000),
              inline: Boolean(field.inline),
            })),
            footer: options.footer ? { text: clean(options.footer, 500) } : undefined,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Discord webhook failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Discord webhook error:", error);
    return false;
  }
}
