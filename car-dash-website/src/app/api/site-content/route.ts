import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTenDollarPackagePriceUpdate } from "@/lib/ten-dollar-pricing-update";
import { SITE_DEFAULTS, normalizeLegacySiteContent } from "@/lib/site-defaults";
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
    await ensureTenDollarPackagePriceUpdate();
    const rows = await prisma.siteContent.findMany({where:{key:{in:Object.keys(SITE_DEFAULTS)}}});
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const stored = Object.fromEntries(rows.filter((row) => allowedKeys.has(row.key)).map((row) => [row.key, row.value]));
    return NextResponse.json(normalizeLegacySiteContent({ ...SITE_DEFAULTS, ...stored }), { status: 200 });
  } catch (error) {
    console.error("Error fetching site content:", error);
    return NextResponse.json(SITE_DEFAULTS, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTenDollarPackagePriceUpdate();
    const auth = await getCurrentAccountFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Website content must be an object of text fields." }, { status: 400 });
    }
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const entries = Object.entries(body).filter(([key]) => allowedKeys.has(key));
    if (entries.some(([, value]) => typeof value !== "string")) {
      return NextResponse.json({ error: "Website content fields must contain text." }, { status: 400 });
    }
    if (entries.some(([, value]) => (value as string).length > 20000)) {
      return NextResponse.json({ error: "One or more website fields exceed the 20,000-character limit." }, { status: 400 });
    }

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
          update: { value: value as string },
          create: { key, value: value as string },
        })
      )
    );

    const rows = await prisma.siteContent.findMany({where:{key:{in:Object.keys(SITE_DEFAULTS)}}});
    const stored = Object.fromEntries(rows.filter((row) => allowedKeys.has(row.key)).map((row) => [row.key, row.value]));
    return NextResponse.json(normalizeLegacySiteContent({ ...SITE_DEFAULTS, ...stored }), { status: 200 });
  } catch (error) {
    console.error("Error updating site content:", error);
    const databaseError = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    const retryable = ["P2024", "P2034"].includes(databaseError);
    return NextResponse.json(
      { error: retryable
          ? "The database was busy. Your edits were not saved; please try again."
          : "Could not save website content. Your edits are still in the editor. Please retry or contact support.",
        code: databaseError || undefined },
      { status: retryable ? 503 : 500 }
    );
  }
}
