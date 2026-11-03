import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
import { decodeStoredProfile } from "@/lib/account-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const ownerKey = (phone: string) => "verified_phone_" + phone;
const releasedKey = (phone: string) => "phone_released_at_" + phone;
const challengeKey = (id: string) => "phone_challenge_" + id;
async function customer(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  return auth && !isStaffAccount(auth) ? auth : null;
}
function sameOrigin(request: NextRequest) {
  return request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!request.headers.get("origin") || request.headers.get("origin") === request.nextUrl.origin);
}
export async function GET(request: NextRequest) {
  const auth = await customer(request);
  if (!auth) return NextResponse.json({ error: "Customer login required" }, { status: 401, headers });
  try {
    const links = await prisma.siteContent.findMany({
      where: { key: { startsWith: "verified_phone_" }, value: auth.id },
      select: { key: true }, orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ phones: links.map(row => row.key.slice("verified_phone_".length)) }, { headers });
  } catch (error) {
    console.error("Unable to check connected mobile numbers", error);
    return NextResponse.json({ error: "Could not check your connected number." }, { status: 500, headers });
  }
}

/** Release only an authenticated customer's own verified number. Past
 * bookings and messages are retained; new phone ownership is isolated. */
export async function DELETE(request: NextRequest) {
  const auth = await customer(request);
  if (!auth) return NextResponse.json({ error: "Customer login required" }, { status: 401, headers });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  const phone = normalizePhoneNumber(String(body?.phone || ""));
  if (!phone || body?.confirmation !== "REMOVE") {
    return NextResponse.json({ error: "Confirm the connected number you want to remove." }, { status: 400, headers });
  }
  try {
    const result = await prisma.$transaction(async tx => {
      // Match the account then phone lock order used when verifying a number.
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))::text", "phone_account_" + auth.id);
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))::text", "phone:" + phone);
      const key = ownerKey(phone);
      const current = await tx.siteContent.findUnique({ where: { key } });
      if (!current || current.value !== auth.id) return { error: "That number is not connected to your account." };

      const removed = await tx.siteContent.deleteMany({ where: { key, value: auth.id } });
      if (!removed.count) return { error: "The connection changed. Refresh and retry." };
      const releasedAt = String(Date.now());
      await tx.siteContent.upsert({
        where: { key: releasedKey(phone) },
        create: { key: releasedKey(phone), value: releasedAt },
        update: { value: releasedAt },
      });
      await tx.siteContent.deleteMany({ where: { key: challengeKey(auth.id) } });

      // Do not autofill a number that may now belong to somebody else.
      const profileKey = "private_account_profile_v1:" + auth.id;
      const stored = await tx.siteContent.findUnique({ where: { key: profileKey } });
      if (stored) {
        const profile = decodeStoredProfile(stored.value);
        if (normalizePhoneNumber(profile.phone) === phone) {
          profile.phone = "";
          await tx.siteContent.update({
            where: { key: profileKey }, data: { value: JSON.stringify(profile) },
          });
        }
      }
      return { removed: true };
    });
    return "error" in result ?
      NextResponse.json(result, { status: 409, headers }) :
      NextResponse.json(result, { headers });
  } catch (error) {
    console.error("Unable to remove verified phone connection", error);
    return NextResponse.json({ error: "Could not remove your number. Try again." }, { status: 500, headers });
  }
}
