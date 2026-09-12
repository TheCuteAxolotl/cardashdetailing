# Car Dash V2 – Quote-first platform

This version changes the site from package-first to service/quote-first.

## Added now
- Service mega-menu with Car Detailing, Marine Detailing, and Ceramic Coatings categories.
- Per-service pricing modes: fixed, starting, estimate range, or quote required.
- Instant Estimate questionnaire.
- Account-required private “Chat to a Specialist” conversations.
- Photo attachments in quote chat (temporary small-image database storage; max 3 files, 450 KB each).
- Staff/owner quote inbox with exact quote sending and quote acceptance.
- Customer saved vehicles.
- Booking availability time slots.
- Customer booking history.
- Ceramic coating warranty records.
- Owner analytics for bookings, leads, customers, and accepted quote value.
- Admins can handle quote chats in addition to bookings/support, but cannot edit the website/services/admin accounts.

## Deferred intentionally
- Stripe payments/deposits.
- Twilio SMS.

The quote schema includes `lastCustomerSeenAt`, so later Twilio can send only when the customer is offline/recently inactive and link directly to `/quote?thread=...`.

## Database deployment
This release adds tables/fields. The build command temporarily runs `prisma db push` before `next build` so Vercel can sync the additive schema. After the first successful production deployment, you can switch `package.json` back to:

`"build": "prisma generate && next build"`

## Photo storage note
For this first version, quote photos are intentionally limited and stored as small data URLs for zero-setup deployment. Before scaling up photo volume, move quote attachments to object storage (Vercel Blob, Cloudinary, S3, etc.) and keep only file URLs in PostgreSQL.
