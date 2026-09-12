# Car Dash Detailing - Vercel setup

## What this version fixes
- Booking form now submits as FormData, matching `/api/bookings`.
- Duplicate booking fields were removed.
- Owner gallery can upload real image files from the browser.
- Photos are resized/compressed in the browser and stored in your Postgres `GalleryImage.url` field, so no extra image-storage service is required for this starter version.
- Owner can rename photos, change placement, set a homepage Hero photo, and delete photos.
- Public `/gallery` and homepage gallery update automatically from the admin dashboard.
- The hard-coded owner password was removed from the source code.

## Required Vercel Environment Variables
Set these in Vercel > Project > Settings > Environment Variables:

DATABASE_URL=<your Postgres connection string>
# V2.2 can also use PRISMA_DATABASE_URL or POSTGRES_URL at runtime.
NEXTAUTH_SECRET=<long random secret>
NEXT_PUBLIC_OWNER_EMAIL=<your owner login email>

Twilio is intentionally not enabled in V3 pre-approval. Do not add Twilio credentials yet. The public consent and legal pages are ready for A2P review first.

For creating/resetting the owner locally, also set:
OWNER_EMAIL=<same owner email>
OWNER_PASSWORD=<strong password, 12+ characters>
OWNER_NAME=<your name>

Then run:
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev

## Admin workflow
1. Visit `/login`.
2. Sign in with the owner email/password created by `npm run seed`.
3. Go to `/owner/dashboard` > Gallery.
4. Upload a photo and choose Gallery, Before & After, Portfolio, or Homepage Hero.
5. Public pages update automatically.

## Important
This starter stores compressed images in Postgres as data URLs. It is simple and reliable for a small portfolio, but for hundreds of large photos you should later move image storage to Vercel Blob or Cloudinary.

## Live Google reviews
Add these Production environment variables in Vercel:

GOOGLE_PLACES_API_KEY=<restricted Places API (New) key>
GOOGLE_PLACE_ID=ChIJOwdh_AoFD4gReP6eOczV_K8

The Google key is used server-side only by `/api/google-reviews`. Do not prefix it with `NEXT_PUBLIC_`.

## V3.1 Twilio SMS

Add these Vercel environment variables for Production (and Preview if you test there):

- `TWILIO_ACCOUNT_SID` — Sensitive
- `TWILIO_AUTH_TOKEN` — Sensitive
- `TWILIO_MESSAGING_SERVICE_SID` — Sensitive
- `NEXT_PUBLIC_SITE_URL=https://cardashdetailing.com`

V3.1 sends SMS only to customers who explicitly opt in. Quote-chat staff replies and final quotes send SMS only when the customer has not been active in the chat within roughly 90 seconds. New bookings send a receipt text when SMS consent is checked. Confirmed, cancelled, and completed booking status changes also send transactional updates when that booking has SMS consent.

SMS failures are logged but never block quote chats or bookings.
