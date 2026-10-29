import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createToken } from "../src/lib/auth";
import { GET } from "../src/app/api/messages/direct/route";

const db = prisma as any;
db.user.findUnique = async () => ({ id: "owner", role: "owner", email: "owner@test.example", name: "Owner" });
db.customRoleAssignment.findMany = async () => [];
db.userPermissionOverride.findMany = async () => [];
db.$executeRawUnsafe = async () => 0;
db.booking.findMany = async () => [
  {id:"b1",customerPhone:"(224) 555-1234",serviceName:"Full Detail",status:"confirmed"},
  {id:"b2",customerPhone:"+12245551234",serviceName:"Ceramic Coating",status:"completed"},
  {id:"unrelated",customerPhone:"+12245550000",serviceName:"Other",status:"confirmed"},
];
db.quoteThread.findMany = async () => [
  {id:"q1",guestPhone:"2245551234",subject:"Paint Correction",status:"quoted"},
];
db.bookingConversation.findMany = async () => [
  {bookingId:"b1",messages:[{id:"bk1",sender:"customer",body:"First booking",externalSid:null,createdAt:new Date(1000)}]},
  {bookingId:"b2",messages:[{id:"bk2",sender:"team",body:"Second booking",externalSid:"SM_DUPLICATE",createdAt:new Date(3000)}]},
];
db.quoteMessage.findMany = async () => [
  {id:"qt1",threadId:"q1",sender:"customer",body:"Quote request",externalSid:null,createdAt:new Date(2000)},
];
db.unmatchedSmsMessage.findMany = async () => [
  {id:"sms1",fromPhone:"Car Dash automated",toPhone:"+12245551234",direction:"outbound",body:"Car Dash Detailing: Your appointment is confirmed",externalSid:"SM_AUTO",createdAt:new Date(4000)},
  {id:"sms2",fromPhone:"Car Dash imported SMS",toPhone:"+12245551234",direction:"outbound",body:"Duplicate saved booking SMS",externalSid:"SM_DUPLICATE",createdAt:new Date(3000)},
  {id:"sms3",fromPhone:"+12245551234",toPhone:"+12245559999",direction:"inbound",body:"Thanks!",externalSid:"SM_REPLY",createdAt:new Date(5000)},
];
const request = new NextRequest("https://cardashdetailing.com/api/messages/direct?phone=2245551234", {
  headers: { cookie: `auth-token=${createToken({ id:"owner", email:"owner@test.example", role:"owner" })}` },
});
async function main() {
  const response = await GET(request);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.messages.length, 5); // two booking + one quote + one automated + one SMS reply
  assert.deepEqual(data.messages.map((m:any) => m.body), [
    "First booking", "Quote request", "Second booking",
    "Car Dash Detailing: Your appointment is confirmed", "Thanks!",
  ]);
  assert.equal(data.messages[3].context, "Automated text");
  assert.deepEqual(data.messages.map((m:any) => m.source), ["booking","quote","booking","sms","sms"]);
  console.log("Customer history joins multiple bookings, quotes, automated texts and replies without duplicate SIDs.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
