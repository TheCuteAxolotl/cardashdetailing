import assert from "node:assert/strict";
import { manualBookingConfirmationText } from "../src/lib/manual-booking-confirmation";
import { normalizePhoneNumber } from "../src/lib/twilio-sms";

const standard=manualBookingConfirmationText({
  customerName:"Jamie Rivera",serviceName:"Full Detail",
  preferredDate:"2026-11-12",preferredTime:"14:30",quotedPrice:249,
  vehicleYear:"2024",vehicleMake:"Toyota",vehicleModel:"RAV4",vehicleTrim:null,
},"123 Main Street, South Elgin, IL 60177");
assert.match(standard,/Hi Jamie! Your Car Dash Detailing appointment is confirmed\./);
assert.match(standard,/Service: Full Detail/);
assert.match(standard,/Vehicle: 2024 Toyota RAV4/);
assert.match(standard,/Date: Thu, Nov 12, 2026/);
assert.match(standard,/Time: 2:30 PM \(CT\)/);
assert.match(standard,/Location: 123 Main Street, South Elgin, IL 60177/);
assert.match(standard,/Total: \$249\.00/);
assert.doesNotMatch(standard,/Owner scheduling notes/);
assert.match(standard,/Reply to this text/);
const noPrice=manualBookingConfirmationText({
  customerName:"Customer",serviceName:"Detailing",
  preferredDate:"2026-11-12",preferredTime:"09:00",quotedPrice:null,
  vehicleYear:"Not specified",vehicleMake:"Not specified",vehicleModel:"Not specified",vehicleTrim:null,
},"");
assert.doesNotMatch(noPrice,/Total:/);
assert.doesNotMatch(noPrice,/Location:/);
assert.doesNotMatch(noPrice,/Vehicle:/);
assert.equal(normalizePhoneNumber("(224) 344-3451"),"+12243443451");
assert.equal(normalizePhoneNumber("not a phone"),null);
console.log("Manual booking confirmation formatting and optional fields verified.");
