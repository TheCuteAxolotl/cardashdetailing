import PricingPageExperience from "@/components/PricingPageExperience";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { getSiteContent } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";

export default async function ExteriorDetailingPage() {
  const content = await getSiteContent();
  const config = parsePricingConfig(content.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior);
  let mediaItems: Array<{ id: string; url: string; title: string; category: string }> = [];
  try {
    mediaItems = await prisma.galleryImage.findMany({
      where: { category: { startsWith: "pricing-exterior-pkg-" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, title: true, category: true },
    });
  } catch (error) {
    console.error("Error loading package media:", error);
  }
  return <PricingPageExperience kind="exterior" initialConfig={config} mediaItems={mediaItems} />;
}
