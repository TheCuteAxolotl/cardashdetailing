# Car Dash Support + Spam Control

Vercel variables:
- `DISCORD_SUPPORT_WEBHOOK_URL` — webhook for the Discord support channel. If omitted, support falls back to `DISCORD_WEBHOOK_URL`.
- `DISCORD_WEBHOOK_URL` — booking notification webhook.
- `SUPPORT_HASH_SECRET` — optional long random secret used to hash visitor IPs. If omitted, NEXTAUTH_SECRET is used.

The deployment build runs `prisma db push` so the new SupportTicket, SupportMessage, and BlockedVisitor tables are created automatically.

Privacy behavior:
- Raw visitor IP and visitor hash are sent only to Discord alerts.
- They are not returned by the website support APIs and are not shown in the Owner Dashboard.
- The Owner Dashboard only provides an input where the owner can paste an IP or visitor hash copied from Discord to block future requests.
- Raw IPs entered into the block box are hashed before storage.

Owner support inbox: `/owner/support`
