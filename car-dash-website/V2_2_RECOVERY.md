# Car Dash V2.2 — database/login recovery

V2.2 keeps all V2.1 quote-chat and Discord features, but changes how the app handles the database on Vercel.

## What changed

- Normal Vercel builds no longer run `prisma db push` every deployment.
- Runtime database selection now accepts all three common Vercel/Prisma variables:
  1. `PRISMA_DATABASE_URL`
  2. `POSTGRES_URL`
  3. `DATABASE_URL`
- Invalid/unresolved variable references are ignored instead of being passed to Prisma.
- Direct PostgreSQL URLs get a small serverless connection limit to reduce connection exhaustion.
- One Prisma client is reused per warm server process.
- Added `/api/health` so database/auth configuration can be checked without exposing secret values.
- Added `.DS_Store` to `.gitignore`.

## After deploying

Open:

`https://cardashdetailing.com/api/health`

Healthy example:

```json
{
  "ok": true,
  "database": "connected",
  "databaseSource": "PRISMA_DATABASE_URL",
  "authSecretConfigured": true,
  "ownerEmailConfigured": true
}
```

If `database` is `not_configured` or `connection_failed`, the Vercel database variables themselves need attention in Vercel. Code cannot recreate or guess a database password/connection string.

## Database schema

V2 already applied the new V2 schema successfully. For future schema changes, run the explicit `db:sync` command intentionally instead of changing the normal production build command.
