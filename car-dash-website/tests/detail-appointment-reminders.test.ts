import assert from "node:assert/strict";
import {
  appointmentReminderBody,
  isDueForReminder,
  localBookingDateTime,
  reminderDateCandidates,
} from "../src/lib/detail-appointment-reminders";

const booking = {
  id: "booking-1",
  status: "confirmed",
  customerName: "Michael Johnson",
  customerPhone: "(630) 555-0100",
  serviceName: "Full Interior & Exterior Detail",
  preferredDate: "2026-10-29",
  preferredTime: "11:00",
  vehicleYear: "2024",
  vehicleMake: "Toyota",
  vehicleModel: "Camry",
  vehicleTrim: null,
  notes: "SMS consent: Yes\nService address: 120 Main St, South Elgin, IL\n[[CAR_DASH_OWNER_NOTES]]\nPrivate owner note: bring equipment\n[[/CAR_DASH_OWNER_NOTES]]",
};

const atNine = new Date("2026-10-29T14:00:00Z"); // 9 AM CDT
assert.equal(isDueForReminder(booking, atNine), true);
assert.equal(isDueForReminder(booking, new Date("2026-10-29T14:05:00Z")), true);
assert.equal(isDueForReminder(booking, new Date("2026-10-29T14:11:00Z")), false);
assert.equal(isDueForReminder(booking, new Date("2026-10-29T13:59:00Z")), false);
assert.equal(isDueForReminder({ ...booking, status: "pending" }, atNine), false);
assert.equal(isDueForReminder({ ...booking, status: "cancelled" }, atNine), false);
assert.equal(isDueForReminder({ ...booking, preferredTime: null }, atNine), false);
assert.equal(isDueForReminder({ ...booking, preferredDate: null }, atNine), false);

const reminder = appointmentReminderBody(booking);
assert.match(reminder, /Hi Michael!/);
assert.match(reminder, /about 2 hours/);
assert.match(reminder, /Service: Full Interior & Exterior Detail/);
assert.match(reminder, /Vehicle: 2024 Toyota Camry/);
assert.match(reminder, /Time: 11:00 AM \(CT\)/);
assert.match(reminder, /Location: 120 Main St, South Elgin, IL/);
assert.doesNotMatch(reminder, /Private owner note|CAR_DASH_OWNER_NOTES/);
assert.doesNotMatch(appointmentReminderBody({ ...booking, notes: "SMS consent: Yes" }), /Location:/);

// Cron candidates must include both dates when the reminder window crosses midnight.
const closeToMidnight = new Date("2026-10-30T03:05:00Z"); // 10:05 PM CDT
assert.deepEqual(reminderDateCandidates(closeToMidnight), ["2026-10-29", "2026-10-30"]);
assert.equal(localBookingDateTime(new Date("2026-11-01T14:00:00Z")), "2026-11-01T08:00");
assert.equal(isDueForReminder({ ...booking, preferredDate: "2026-11-01", preferredTime: "08:00" }, new Date("2026-11-01T12:00:00Z")), true);

console.log("Appointment reminders: two-hour window, status filtering, Chicago DST, and owner-note privacy verified.");
