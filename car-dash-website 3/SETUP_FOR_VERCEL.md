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
NEXTAUTH_SECRET=<long random secret>
NEXT_PUBLIC_OWNER_EMAIL=<your owner login email>

Optional Twilio variables:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_NOTIFY_NUMBERS=+1..., +1...

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
