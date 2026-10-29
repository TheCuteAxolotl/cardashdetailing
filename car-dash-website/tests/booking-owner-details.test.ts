import assert from "node:assert/strict";
import { bookingOwnerNotes, bookingServiceAddress, replaceBookingOwnerDetails, customerVisibleBookingNotes } from "../src/lib/booking-owner-details";
import { embedBookingPhotos, extractBookingPhotos, stripBookingPhotos } from "../src/lib/booking-photos";

const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
const original = embedBookingPhotos([
  "Estimated duration minutes: 240",
  "Booking source: Website booking",
  "SMS consent: Yes",
  "Discount: NEW25",
  "Service address: Not specified",
  "Customer notes: Focus on the back seats",
].join("\n"), [photo]);

const changed = replaceBookingOwnerDetails(original, "120 Main St, South Elgin, IL 60177", "Please park on the driveway\nBring extra towels");
assert.equal(bookingServiceAddress(changed), "120 Main St, South Elgin, IL 60177");
assert.equal(bookingOwnerNotes(changed), "Please park on the driveway\nBring extra towels");
assert.deepEqual(extractBookingPhotos(changed), [photo]);
for (const line of ["Estimated duration minutes: 240", "SMS consent: Yes", "Discount: NEW25", "Customer notes: Focus on the back seats"])
  assert.ok(stripBookingPhotos(changed).includes(line), line + " must survive editing");

const second = replaceBookingOwnerDetails(changed, "400 New Street, Geneva, IL", "Call on arrival");
assert.equal(bookingServiceAddress(second), "400 New Street, Geneva, IL");
assert.equal(bookingOwnerNotes(second), "Call on arrival");
assert.equal((second.match(/Service address:/g) || []).length, 1);
assert.equal((second.match(/\[\[CAR_DASH_OWNER_NOTES\]\]/g) || []).length, 1);
assert.deepEqual(extractBookingPhotos(second), [photo]);
const publicNotes = customerVisibleBookingNotes(second) || "";
assert.ok(!publicNotes.includes("Call on arrival"));
assert.ok(!publicNotes.includes("CAR_DASH_OWNER_NOTES"));
assert.ok(publicNotes.includes("Customer notes: Focus on the back seats"));
assert.ok(publicNotes.includes("Service address: 400 New Street, Geneva, IL"));
assert.equal(bookingServiceAddress("Service address: Not specified"), "");
assert.equal(bookingServiceAddress("Booking source: call"), "");
assert.equal(bookingOwnerNotes("Owner notes: Follow up with customer"), "Follow up with customer");

console.log("Booking editor notes: addresses, updates, original notes, consent, discounts, durations and photos preserved.");
