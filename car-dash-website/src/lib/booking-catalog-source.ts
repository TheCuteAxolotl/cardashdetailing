import { prisma } from "@/lib/prisma";
import { CATALOG_SOURCE_KEYS, type CatalogSource } from "@/lib/booking-catalog";

/** The saved menu and add-on prices, read fresh for each owner booking. */
export async function loadCatalogSource(): Promise<CatalogSource> {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: [...CATALOG_SOURCE_KEYS] } }, select: { key: true, value: true } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
