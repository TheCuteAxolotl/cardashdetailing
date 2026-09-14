import SimplePricingHub from "@/components/SimplePricingHub";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { parseBookingPricingConfig } from "@/lib/booking-pricing";
import { getSiteContent } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";

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

  return (
    <main className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">All prices</p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <h1 className="max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Everything in one place.</h1>
            <div>
              <p className="max-w-2xl text-base leading-7 text-black/52">Compare the prices, tap the package that fits your vehicle, and go straight to booking. You do not need to open a separate page for every service.</p>
              <div className="mt-5 flex flex-wrap gap-3"><a href="/#book" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">Book now</a><a href="/quote" className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold">Get an exact quote</a></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <SimplePricingHub configs={configs} bookingPricing={bookingPricing} services={services} />
      </section>
    </main>
  );
}
