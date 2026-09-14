import SimplePricingHub from "@/components/SimplePricingHub";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { parseBookingPricingConfig } from "@/lib/booking-pricing";
import { getSiteContent } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";
import SitePhoto from "@/components/SitePhoto";
import PageMediaBand from "@/components/PageMediaBand";
import type { MediaItem } from "@/lib/media";

export default async function ServicesPage() {
  const content = await getSiteContent();
  const configs = {
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

  let mediaItems: MediaItem[] = [];

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
    console.error("Error loading services page pricing:", error);
  }

  try {
    mediaItems = await prisma.galleryImage.findMany({
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
    console.error("Error loading services page media:", error);
  }

  return (
    <main className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-3 lg:py-8">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">All prices</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Everything in one place.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/52">Compare the prices, tap the package that fits your vehicle, and go straight to booking. You do not need to open a separate page for every service.</p>
            <div className="mt-5 flex flex-wrap gap-3"><a href="/#book" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">Book now</a><a href="/quote" className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold">Get an exact quote</a></div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[380px]">
            <SitePhoto category="services-hero" fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>
      </section>
      <PageMediaBand categories={["services-media"]} theme="light" compact className="mx-auto max-w-7xl px-5 pt-10 sm:px-8" />
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <SimplePricingHub configs={configs} bookingPricing={bookingPricing} services={services} mediaItems={mediaItems} />
      </section>
    </main>
  );
}
