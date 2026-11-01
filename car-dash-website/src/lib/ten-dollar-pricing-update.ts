import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING_PAGES, parsePricingConfig, reducePackagePrices } from "@/lib/pricing-config";

// One-time, idempotent price change requested on November 1, 2026.
// This is a targeted data migration, not a recurring sale or discount code.
const CHANGE_KEY = "car_dash_package_price_change_2026_11_01_minus_10";
const TARGETS = [
  ["pricingPackagesConfig", "packages"],
  ["pricingExteriorConfig", "exterior"],
  ["pricingInteriorConfig", "interior"],
] as const;

/**
 * Existing owner-edited pricing is stored in SiteContent and overrides code
 * defaults. Migrate only those persisted JSON menus, once, without changing
 * existing bookings, add-ons, ceramics, or any non-package pricing.
 */
export async function ensureTenDollarPackagePriceUpdate() {
  const complete = await prisma.siteContent.findUnique({
    where: { key: CHANGE_KEY },
    select: { id: true },
  });
  if (complete) return;

  await prisma.$transaction(async tx => {
    // Serialize simultaneous requests across serverless instances.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(2026110101::bigint)`;
    const existingMarker = await tx.siteContent.findUnique({
      where: { key: CHANGE_KEY },
      select: { id: true },
    });
    if (existingMarker) return;

    const saved = await tx.siteContent.findMany({
      where: { key: { in: TARGETS.map(([key]) => key) } },
      select: { key: true, value: true },
    });
    for (const [key, kind] of TARGETS) {
      const existing = saved.find(row => row.key === key);
      if (!existing) continue; // Unedited menus now use updated $10-lower defaults.

      const parsed = parsePricingConfig(existing.value, DEFAULT_PRICING_PAGES[kind]);
      // The parser replaces legacy two-package menus with the current default,
      // including Signature. That default is already $10 lower.
      const discounted = parsed === DEFAULT_PRICING_PAGES[kind]
        ? parsed
        : reducePackagePrices(parsed, 10);
      await tx.siteContent.update({
        where: { key },
        data: { value: JSON.stringify(discounted) },
      });
    }

    await tx.siteContent.create({
      data: {
        key: CHANGE_KEY,
        value: JSON.stringify({ change: -10, categories: TARGETS.map(([, kind]) => kind) }),
      },
    });
  }, { maxWait: 10000, timeout: 20000 });
}
