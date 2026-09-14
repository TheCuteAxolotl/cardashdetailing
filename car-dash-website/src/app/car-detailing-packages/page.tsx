import PricingPageExperience from "@/components/PricingPageExperience";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { getSiteContent } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";

export default async function CarDetailingPackagesPage() {
  const content = await getSiteContent();
  const config = parsePricingConfig(content.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages);
  let mediaItems: Array<{ id: string; url: string; title: string; category: string }> = [];
  try {
    mediaItems = await prisma.galleryImage.findMany({
      where: { category: { startsWith: "pricing-car-packages-pkg-" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, title: true, category: true },
    });
  } catch (error) {
    console.error("Error loading package media:", error);
  }
  return <PricingPageExperience kind="packages" initialConfig={config} mediaItems={mediaItems} />;
}
