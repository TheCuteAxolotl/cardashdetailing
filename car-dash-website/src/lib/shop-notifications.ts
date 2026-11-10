import type { Order } from "@/lib/shop";

export async function notifyMerchDiscord(order: Order): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook || !order.paidAt) return;

  // Shipping addresses and customer contact details stay in the owner-only dashboard.
  const content = [
    "**New paid Car Dash shop order**",
    "Item: " + order.item.replace(/[\r\n@]/g, " ").slice(0, 180),
    "Amount: $" + (order.cents / 100).toFixed(2),
    "Order: " + order.id.slice(0, 8).toUpperCase(),
    order.status === "reserved" ? "Paid reservation — check supplier availability" : "Ready for manual TapStitch fulfillment",
    "Open: https://cardashdetailing.com/owner/shop?view=orders",
  ].join("\n");

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Car Dash Shop",
        allowed_mentions: { parse: [] },
        content,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("Merch Discord notification failed:", response.status);
    }
  } catch (error) {
    console.error("Merch Discord notification failed:", error);
  }
}
