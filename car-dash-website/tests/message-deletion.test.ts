import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createToken } from "../src/lib/auth";
import { DELETE } from "../src/app/api/messages/delete/route";
import { GET as media } from "../src/app/api/sms/media/[sid]/route";
import { storeInboundSms } from "../src/lib/inbound-sms";
import { DELETED_MESSAGE } from "../src/lib/deleted-message";

const db = prisma as any;
let role = "user", changes = 0;
db.user.findUnique = async () => ({ id: "test", role, email: "test@example.com", name: "Test" });
db.customRoleAssignment.findMany = async () => [];
db.userPermissionOverride.findMany = async () => [];
db.$executeRawUnsafe = async () => 0;
const rows: Record<string, any> = Object.fromEntries(["quote", "booking", "sms"].map(kind => [kind, { id: kind, body: "Photo", attachmentsJson: '["data:image/jpeg;base64,YQ=="]', externalSid: "SM" + "a".repeat(32), sender: "customer" }]));
for (const [kind, model] of [["quote", "quoteMessage"], ["booking", "bookingMessage"], ["sms", "unmatchedSmsMessage"]]) {
  db[model].updateMany = async ({ where, data }: any) => { if (where.id === "system") { assert.equal(where.sender.not, "system"); return { count: 0 }; } assert.equal(where.id, kind); Object.assign(rows[kind], data); changes++; return { count: 1 }; };
  db[model].findFirst = async ({ where }: any) => { assert.equal(where.body.not, DELETED_MESSAGE); return rows[kind].body === DELETED_MESSAGE ? null : rows[kind]; };
  db[model].findUnique = async () => rows[kind];
}
function request(kind: string, origin?: string, id = kind) {
  return new NextRequest("https://cardashdetailing.com/api/messages/delete", { method: "DELETE", headers: { cookie: `auth-token=${createToken({ id: "test", email: "test@example.com", role })}`, "Content-Type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify({ kind, id }) });
}
async function main() {
  assert.equal((await DELETE(request("sms"))).status, 403);
  role = "admin"; assert.equal((await DELETE(request("sms"))).status, 403); assert.equal(changes, 0);
  role = "owner"; assert.equal((await DELETE(request("sms", "https://example.org"))).status, 403); assert.equal(changes, 0);
  assert.equal((await DELETE(request("invalid"))).status, 400);
  for (const kind of ["quote", "booking", "sms"]) { assert.equal((await DELETE(request(kind))).status, 200); assert.equal(rows[kind].body, DELETED_MESSAGE); assert.equal(rows[kind].attachmentsJson, null); assert.ok(rows[kind].externalSid); }
  assert.equal((await DELETE(request("quote", undefined, "system"))).status, 404);
  const sid = rows.sms.externalSid;
  assert.equal((await media(new NextRequest(`https://cardashdetailing.com/api/sms/media/${sid}`, { headers: { cookie: `auth-token=${createToken({ id: "test", email: "test@example.com", role })}` } }), { params: Promise.resolve({ sid }) })).status, 403);
  assert.deepEqual(await storeInboundSms({ from: "+12245551234", sid, body: "Original deleted text" }), { stored: false, reason: "duplicate" });
  console.log("Owner-only deletion, CSRF rejection, photo redaction, media denial, system protection, and SMS reimport protection passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
