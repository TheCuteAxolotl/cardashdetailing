# Twilio compliance deployment

This small release is intentionally limited to the public compliance pieces needed before A2P submission.

Public URLs after deployment:
- https://cardashdetailing.com/privacy-policy
- https://cardashdetailing.com/terms-and-conditions

Booking form changes:
- Adds a separate, optional SMS consent checkbox.
- Checkbox is unchecked by default.
- Booking remains available without SMS consent.
- Includes message frequency, message/data rates, STOP/HELP, and links to both legal pages.

No Prisma schema changes are included in this release.
No database push is required.
