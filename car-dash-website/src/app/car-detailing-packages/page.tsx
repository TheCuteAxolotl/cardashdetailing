import PricingPageExperience from "@/components/PricingPageExperience";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { getSiteContent } from "@/lib/site-content";

export default async function CarDetailingPackagesPage() {
  const content = await getSiteContent();
  const config = parsePricingConfig(content.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages);
  return <PricingPageExperience kind="packages" initialConfig={config} />;
}
