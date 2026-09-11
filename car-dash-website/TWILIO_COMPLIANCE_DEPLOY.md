# Twilio compliance readiness — V3 pre-approval

Public URLs after deployment:
- https://cardashdetailing.com/privacy-policy
- https://cardashdetailing.com/terms-and-conditions

Web opt-in is prepared on both booking and quote flows:
- Separate optional SMS consent checkbox.
- Checkbox is unchecked by default.
- Service/quote use remains available without SMS consent.
- Message frequency, message/data rates, STOP/HELP, Privacy Policy, and Terms and Conditions are shown.

This release does **not** send SMS yet. Twilio credentials and outbound SMS should be added only after A2P registration is approved.

No Prisma schema changes are required for this V3 release.
