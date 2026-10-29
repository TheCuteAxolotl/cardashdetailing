# Automatic two-hour detailing reminders

## What gets sent
- Every five minutes, the production cron checks confirmed bookings whose start time is about two hours away in the configured booking timezone (default `America/Chicago`).
- It texts the customer's existing phone number using the site's existing Twilio Messaging Service.
- The message includes the service, available vehicle details, appointment date/time and the service address **only when one was recorded**. Private owner notes are never included.
- The SMS is stored in both the phone-number conversation timeline and the booking's chat (de-duplicated by Twilio SID in the unified inbox).

## Safety
- **Confirmed bookings only.** Pending bookings and quotes never trigger reminders.
- **Consent required.** Only bookings with the existing exact `SMS consent: Yes` note are eligible. Manually entered bookings have no consent by default.
- Cancelled/completed bookings don't get reminders. Changes to the appointment time automatically change what is eligible.
- Uses a unique database lock per booking/date/time to avoid duplicate reminders from simultaneous cron invocations.
- SMS send failures release the lock so a later cron invocation can retry during the ten-minute window. After Twilio accepts a send, the lock is kept even if history logging fails.
- No customer reminders send without a configured `CRON_SECRET` (and existing Twilio credentials).

## Activate
1. Ensure the Vercel project uses `car-dash-website` as its root directory and uses the **Pro** plan (Hobby cron schedules cannot run every five minutes).
2. In Vercel project environment variables, configure `CRON_SECRET` with a long unpredictable string (at least 16 characters). Keep it private. Use the production environment.
3. Ensure the existing `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_MESSAGING_SERVICE_SID` are correctly configured.
4. Deploy this change. Vercel reads `vercel.json` and invokes `GET /api/cron/appointment-reminders` every five minutes with `Authorization: Bearer <CRON_SECRET>`.
5. Confirm the cron is active in Vercel's Cron Jobs settings and inspect its function logs. The response reports candidate, sent, skipped, and failed counts without exposing customer details.

## Local testing
Run `npx tsx tests/detail-appointment-reminders.test.ts` from `car-dash-website`.

Note: Reminder delivery may be several minutes after the exact two-hour mark due to the five-minute polling cadence and provider processing. After a prolonged outage beyond the ten-minute window, the job won't send a late reminder.
