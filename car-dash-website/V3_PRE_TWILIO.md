# Car Dash Detailing V3 — Pre-Twilio Release

This release finishes the V3 website changes that do not require an approved Twilio/A2P account.

## Included now
- Public Privacy Policy and Terms and Conditions pages and footer links.
- Optional, unchecked SMS consent on booking and quote forms for compliance preparation.
- No SMS is sent by this release.
- Quote chat statuses: open, quoted, accepted, booked, closed.
- Closed and booked quote chats are read-only.
- Owner-only permanent quote chat deletion.
- Owner/admin can close and reopen non-booked quote chats.
- Final quote acceptance followed by a Book Now flow.
- Accepted quote price is server-verified and carried into the booking.
- Every new booking has an exact total saved in Booking.quotedPrice.
- Direct website bookings are limited to fixed-price services so the total is exact.
- Starting/range/quote-only services route customers through estimate or specialist quote before booking.
- Booking totals appear in owner, admin, and customer views.
- Analytics uses exact booking totals.
- Estimate adjustments were lowered and estimate min/max remain editable in Owner > Services & Pricing.
- Homepage service-area wording was removed.
- Existing Discord booking and customer quote notifications remain enabled.

## Twilio intentionally not enabled yet
The code does not send customer SMS notifications in this release. After A2P approval, SMS can be added using the existing consent language and customer-presence logic.

## Database safety
No Prisma schema change is required for these V3 features. The existing Booking.quotedPrice field is reused as the exact booking total, so normal deploys can keep:

`prisma generate && next build`
