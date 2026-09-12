import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import { getCurrentAccountFromRequest, hasStaffPermission, isOwnerAccount } from "@/lib/permissions";

const PRICING_KEYS = new Set([
  "pricingPackagesConfig",
  "pricingExteriorConfig",
  "pricingInteriorConfig",
  "bookingPricingConfig",
]);

function canEditKey(auth: Awaited<ReturnType<typeof getCurrentAccountFromRequest>>, key: string) {
  if (isOwnerAccount(auth)) return true;
  if (PRICING_KEYS.has(key)) return hasStaffPermission(auth, "pricing");
  return hasStaffPermission(auth, "website");
}

export async function GET() {
  try {
    const rows = await prisma.siteContent.findMany();
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const stored = Object.fromEntries(rows.filter((row) => allowedKeys.has(row.key)).map((row) => [row.key, row.value]));
    return NextResponse.json({ ...SITE_DEFAULTS, ...stored }, { status: 200 });
  } catch (error) {
    console.error("Error fetching site content:", error);
    return NextResponse.json(SITE_DEFAULTS, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });

    const body = await request.json();
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const entries = Object.entries(body).filter(([key]) => allowedKeys.has(key));

    const writableEntries = entries.filter(([key]) => canEditKey(auth, key));
    if (!writableEntries.length) {
      return NextResponse.json({ error: "This account does not have access to edit that website section." }, { status: 403 });
    }

    // Some editors submit the entire site-content object even when the staff member
    // only has access to one section. Ignore fields outside that account's permission
    // instead of rejecting the whole save. The owner can still edit every key.
    await prisma.$transaction(
      writableEntries.map(([key, value]) =>
        prisma.siteContent.upsert({
          where: { key },
          update: { value: String(value ?? "").slice(0, 20000) },
          create: { key, value: String(value ?? "").slice(0, 20000) },
        })
      )
    );

    const rows = await prisma.siteContent.findMany();
    const stored = Object.fromEntries(rows.filter((row) => allowedKeys.has(row.key)).map((row) => [row.key, row.value]));
    return NextResponse.json({ ...SITE_DEFAULTS, ...stored }, { status: 200 });
  } catch (error) {
    console.error("Error updating site content:", error);
    return NextResponse.json({ error: "Failed to update website content" }, { status: 500 });
  }
}
