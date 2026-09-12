# Fixes applied

- Login now normalizes email addresses before lookup.
- Prisma client is reused across warm server processes and standard PostgreSQL URLs get a conservative serverless connection limit when one is not already configured.
- Vercel builds no longer run `prisma db push` on every deployment. Use `npm run db:push` only when intentionally changing the database schema.
- Public image requests can request only the categories they need instead of downloading every stored base64 image.
- Homepage/background/gallery image components now request smaller targeted image sets.
- Targeted image responses have short caching to reduce database traffic and connection pressure.
- Support chat no longer hits the database just because an old support session exists in localStorage; it loads when the support panel is opened.
- Support polling was reduced from 3.5 seconds to 10 seconds and pauses while the tab is hidden.
- Owner support polling was reduced similarly.
- Discord support sends now log non-2xx webhook responses in Vercel logs instead of silently ignoring them.
- Support inbox now has error handling and limits the initial ticket query to the latest 100 tickets.
- Existing Block and Unblock support controls are retained.
- Header retains Gallery, Contact, and Support controls.
