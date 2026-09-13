import PricingPageExperience from "@/components/PricingPageExperience";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { getSiteContent } from "@/lib/site-content";

export default async function ExteriorDetailingPage() {
  const content = await getSiteContent();
  const config = parsePricingConfig(content.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior);
  return <PricingPageExperience kind="exterior" initialConfig={config} />;
}
