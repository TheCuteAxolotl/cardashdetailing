# Car Dash Support + Discord setup

This build includes a site-wide Support button, website chat, an owner Support Center, Discord support alerts, rate limiting, and visitor blocking.

## Vercel environment variables

Keep the existing variables. Add this for the dedicated Discord support channel:

```text
DISCORD_SUPPORT_WEBHOOK_URL=<full Discord webhook URL for the support channel>
```

`DISCORD_WEBHOOK_URL` remains the booking-notification webhook. If `DISCORD_SUPPORT_WEBHOOK_URL` is missing, support alerts fall back to `DISCORD_WEBHOOK_URL`.

Optional security variable:

```text
VISITOR_HASH_SECRET=<long random secret>
```

If omitted, the app uses `NEXTAUTH_SECRET` to create the visitor identifier hash. Never expose either secret in client-side code.

## Database update

The Prisma schema now contains support tickets, support messages, blocked visitors, and a non-public visitor hash on bookings. The current build command runs `prisma db push` before Next.js builds so Vercel can create the new tables/columns during the first deployment.

## How support works

- A visitor clicks the fixed Support button on the public site.
- They can choose website chat, email follow-up, or phone/text follow-up.
- A new ticket is saved and a Discord message is sent to the support webhook.
- The Discord message includes the request plus the IP and a one-way visitor hash for anti-spam review.
- The website Owner Dashboard does not display the IP or visitor hash.
- Owner Dashboard -> Support lets the owner reply through the website. The visitor's open support window polls for replies every few seconds.
- Customer replies to an existing support ticket also send a Discord alert.

## Spam controls

- Support: up to 3 new tickets per visitor hash per 30 minutes.
- Support chat: up to 8 customer messages per ticket per minute.
- Bookings: up to 4 booking requests per visitor hash per hour.
- Owner Dashboard -> Support includes a block field. Paste either the raw IP or visitor hash from Discord. If an IP is pasted, the server hashes it before storing the block.
- The raw IP is never stored in the app database by this feature. It is sent only to the configured Discord webhook.
- Blocked identifiers are not displayed back in the owner dashboard; only the optional label/date and unblock control are shown.
