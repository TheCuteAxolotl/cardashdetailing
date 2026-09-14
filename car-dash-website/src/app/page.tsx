import type { Metadata } from "next";
import HomeExperience from "@/components/HomeExperience";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl, pageMetadata, SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { parseBookingPricingConfig } from "@/lib/booking-pricing";
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
  const pricingConfigs = {
    packages: parsePricingConfig(content.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
    interior: parsePricingConfig(content.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
    exterior: parsePricingConfig(content.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
  };
  const bookingPricing = parseBookingPricingConfig(content.bookingPricingConfig);

  let services: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    startingPrice: number | null;
    maxPrice: number | null;
    pricingType: string;
    category: string;
    subcategory: string;
  }> = [];

  try {
    services = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        startingPrice: true,
        maxPrice: true,
        pricingType: true,
        category: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Error loading public services for homepage:", error);
  }


  let pricingMedia: Array<{ id: string; url: string; title: string; category: string }> = [];
  try {
    pricingMedia = await prisma.galleryImage.findMany({
      where: {
        OR: [
          { category: { startsWith: "pricing-" } },
          { category: { startsWith: "service-" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, title: true, category: true },
    });
  } catch (error) {
    console.error("Error loading package media for homepage:", error);
  }

  return (
    <>
      <StructuredData data={websiteSchema} />
      <HomeExperience initialContent={content} pricingConfigs={pricingConfigs} bookingPricing={bookingPricing} services={services} pricingMedia={pricingMedia} />
    </>
  );
}
