/**
 * Notify the owner channel when an assigned detailer's job begins or finishes.
 * These are server-only, best-effort notifications made after the job transaction commits.
 */
export type JobDiscordEvent = {
  action: "start" | "submit";
  jobId: string;
  actorName: string;
  detailerName: string;
  customerName: string;
  vehicle: string;
  serviceName: string;
  occurredAt: string;
  startedAt: string | null;
};

function field(value: string | null | undefined, max = 200): string {
  return (value || "Not provided")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/@/g, "＠")
    .trim()
    .slice(0, max) || "Not provided";
}

function centralTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export async function notifyJobDiscord(event: JobDiscordEvent): Promise<void> {
  // By default send to the existing booking/quote notification channel.
  // Optionally set DISCORD_JOB_WEBHOOK_URL to move job alerts to their own channel.
  const webhook = (process.env.DISCORD_JOB_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL)?.trim();
  if (!webhook) {
    console.warn("Discord job notification skipped: no job or main Discord webhook configured.");
    return;
  }

  const finished = event.action === "submit";
  const startMs = event.startedAt ? new Date(event.startedAt).getTime() : NaN;
  const finishMs = new Date(event.occurredAt).getTime();
  const elapsedMinutes = finished && Number.isFinite(startMs) && Number.isFinite(finishMs) && finishMs >= startMs
    ? Math.round((finishMs - startMs) / 60000)
    : null;
  const elapsed = elapsedMinutes === null
    ? "Unavailable"
    : `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`;
  const link = `https://cardashdetailing.com/owner/jobs?job=${encodeURIComponent(event.jobId)}`;
  const embed = {
    title: finished ? "Detailer finished work" : "Detailer started work",
    description: finished
      ? "The detailer marked this job complete. It is awaiting owner review."
      : "The detailer started this assigned job. Its status is now In progress.",
    color: finished ? 0x69aa8c : 0xd6b779,
    url: link,
    fields: [
      { name: "Detailer", value: field(event.detailerName), inline: true },
      { name: "Action by", value: field(event.actorName), inline: true },
      { name: "Customer", value: field(event.customerName), inline: true },
      { name: "Vehicle", value: field(event.vehicle), inline: true },
      { name: "Service", value: field(event.serviceName), inline: true },
      { name: finished ? "Finished at" : "Started at", value: centralTime(event.occurredAt), inline: false },
      ...(finished ? [
        { name: "Started at", value: event.startedAt ? centralTime(event.startedAt) : "Unavailable", inline: true },
        { name: "Work duration", value: elapsed, inline: true },
      ] : []),
    ],
    timestamp: event.occurredAt,
    footer: { text: "Car Dash Detailing · Assigned jobs" },
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Car Dash · Jobs",
        allowed_mentions: { parse: [] },
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("Discord job notification failed:", response.status);
    }
  } catch (error) {
    console.error("Discord job notification failed:", error);
  }
}
