import type { Metadata } from "next";
import HomeExperience from "@/components/HomeExperience";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl, pageMetadata, SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { PROMOTIONS_KEY, parsePromotions } from "@/lib/promotions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = pageMetadata({
  title: "Mobile Detailing in South Elgin, IL",
  description:
    "See Car Dash Detailing prices, choose a mobile detailing service, and book an available appointment in South Elgin and nearby suburbs.",
  path: "/",
  keywords: [
    "mobile detailing South Elgin",
    "car detailing prices South Elgin",
    "interior detailing South Elgin",
    "exterior detailing South Elgin",
    "book mobile detailing South Elgin",
  ],
});

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Car Dash Detailing",
  publisher: { "@id": `${SITE_URL}/#business` },
  potentialAction: {
    "@type": "CommunicateAction",
    target: absoluteUrl("/#book"),
    name: "Book Car Dash Detailing",
  },
};

export default async function Home() {
  const content = await getSiteContent();
  const promoRow = await prisma.siteContent.findUnique({where:{key:PROMOTIONS_KEY}}).catch(()=>null);
  const promotions = parsePromotions(promoRow?.value);
  const pricingConfig = parsePricingConfig(content.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages);

  let hero360Frames: Array<{ id: string; url: string; title: string; category: string }> = [];
  try {
    hero360Frames = await prisma.galleryImage.findMany({
      where: { category: "home-360" },
      orderBy: { createdAt: "asc" },
      take: 36,
      select: { id: true, url: true, title: true, category: true },
    });
  } catch (error) {
    console.error("Error loading homepage 360 frames:", error);
  }

  let pricingMedia: Array<{ id: string; url: string; title: string; category: string }> = [];
  try {
    pricingMedia = await prisma.galleryImage.findMany({
      where: { category: { startsWith: "pricing-car-packages-" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, title: true, category: true },
    });
  } catch (error) {
    console.error("Error loading package media for homepage:", error);
  }

  return (
    <>
      <StructuredData data={websiteSchema} />
      <HomeExperience
        initialContent={content}
        pricingConfig={pricingConfig}
        promotions={promotions}
        pricingMedia={pricingMedia}
        hero360Frames={hero360Frames}
      />
    </>
  );
}
