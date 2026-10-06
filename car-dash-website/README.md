# Car Dash Detailing Website

Production website for Car Dash Detailing. Built with Next.js 16, React 19, Prisma/PostgreSQL, Twilio, and Stripe invoice payments.

## Local development

```bash
npm ci
npm run dev
```

Production validation:

```bash
npm run lint
npm run build
```

## Database

Prisma schema: `prisma/schema.prisma`

Useful commands:

```bash
npm run db:push
npm run seed
```

The app uses PostgreSQL. Local SQLite database files are not part of the project.

## Environment variables used by the app

Core: `DATABASE_URL`, `JWT_SECRET` or `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `OWNER_EMAIL` / `NEXT_PUBLIC_OWNER_EMAIL`.

Optional integrations depend on enabled features: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_VOICE_NUMBER`, `TWILIO_FORWARD_TO_NUMBER`, `TWILIO_INBOUND_WEBHOOK_URL`, `TWILIO_VOICE_WEBHOOK_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `DISCORD_WEBHOOK_URL`, `DISCORD_SUPPORT_WEBHOOK_URL`, and `SUPPORT_HASH_SECRET`.

## Branding

Current public brand assets live in `public/`:

- `brand-logo.png` — header and structured-data logo
- `favicon.png` — browser tab icon
- `apple-touch-icon.png` — iOS home-screen icon

## Deployment

The repository is designed for Vercel deployment from the project root `car-dash-website/`.
