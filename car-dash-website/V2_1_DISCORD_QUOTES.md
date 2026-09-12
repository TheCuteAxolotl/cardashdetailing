# Car Dash V2.1 — Quote Chat Discord Notifications

V2.1 routes quote-chat notifications to the same Discord webhook already used for bookings: `DISCORD_WEBHOOK_URL`.

Discord is notified when:
- a customer starts a new quote chat,
- a customer sends a new quote-chat reply,
- a customer sends photos in quote chat,
- a customer accepts a quote.

Discord is NOT notified when an owner/admin replies, so the staff channel does not spam itself.

Twilio remains intentionally disconnected for now.
