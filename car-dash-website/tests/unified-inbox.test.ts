import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createToken } from "../src/lib/auth";
import { GET } from "../src/app/api/messages/inbox/route";
const db = prisma as any;
let role = "owner", quoteReads = 0;
db.user.findUnique = async () => ({ id: "test", role, email: "test@example.com", name: "Test" });
db.customRoleAssignment.findMany = async () => [];
db.userPermissionOverride.findMany = async () => [];
db.$executeRawUnsafe = async () => 0;
db.bookingConversation.findMany = async () => [{ booking: { id: "booking", customerName: "Booked customer", customerPhone: "+12245551234", serviceName: "Full detail", status: "confirmed" }, messages: [{ body: "Booking reply", createdAt: new Date(6000) }], updatedAt: new Date(0) }];
db.quoteThread.findMany = async ({ select }: any) => { quoteReads++; assert.equal(select.messages.take, 1); assert.equal(select.messages.select.attachmentsJson, undefined); return ["open", "quoted", "accepted", "booked", "closed"].map((status, i) => ({ id: status, status, subject: "Quote", guestName: "Customer", guestPhone: "+12245551234", user: null, messages: [{ body: status, createdAt: new Date(i * 1000) }], updatedAt: new Date(0) })); };
db.unmatchedSmsMessage.findMany = async () => [{ fromPhone: "business", toPhone: "+12245550000", direction: "outbound", body: "Latest", createdAt: new Date(8000) }, { fromPhone: "+12245550000", toPhone: "business", direction: "inbound", body: "Earlier", createdAt: new Date(7000) }];
function request() { return new NextRequest("https://cardashdetailing.com/api/messages/inbox", { headers: { cookie: `auth-token=${createToken({ id: "test", email: "test@example.com", role })}` } }); }
async function main() {
  assert.equal((await GET(new NextRequest("https://cardashdetailing.com/api/messages/inbox"))).status, 403);
  const response = await GET(request()), data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.owner, true);
  // One phone gets exactly one customer thread even across five quotes and a booking.
  assert.equal(data.conversations.length, 2);
  assert.equal(data.conversations[0].body, "Latest");
  assert.equal(data.conversations[0].kind, "sms");
  assert.equal(data.conversations[0].phone, "+12245550000");
  assert.equal(data.conversations[1].kind, "sms");
  assert.equal(data.conversations[1].phone, "+12245551234");
  assert.equal(data.conversations[1].name, "Booked customer");
  role = "user"; assert.equal((await GET(request())).status, 403); assert.equal(quoteReads, 1);
  console.log("Unified inbox groups quotes, bookings and SMS by phone without duplicating a customer, and enforces staff access.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
