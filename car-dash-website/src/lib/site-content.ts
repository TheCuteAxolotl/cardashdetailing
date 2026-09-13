import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeLegacySiteContent, SITE_DEFAULTS } from "@/lib/site-defaults";
import type { SiteContent } from "@/lib/site-defaults";

/**
 * Load the editable public-site content before the page is rendered.
 *
 * Public pages used to render SITE_DEFAULTS first and then replace that copy in
 * the browser after /api/site-content finished loading. That caused the old
 * wording to flash on every refresh/navigation. Keeping this server-side means
 * the first HTML already contains the current database copy.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  // This content can be edited from the owner dashboard, so render it at
  // request time instead of baking a database snapshot into the production build.
  await connection();

  try {
    const rows = await prisma.siteContent.findMany();
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const stored = Object.fromEntries(
      rows
        .filter((row) => allowedKeys.has(row.key))
        .map((row) => [row.key, row.value])
    );

    return normalizeLegacySiteContent({
      ...SITE_DEFAULTS,
      ...stored,
    }) as SiteContent;
  } catch (error) {
    console.error("Error loading server-rendered site content:", error);
    return { ...SITE_DEFAULTS } as SiteContent;
  }
});
