import PricingPageExperience from "@/components/PricingPageExperience";
import { DEFAULT_PRICING_PAGES, parsePricingConfig } from "@/lib/pricing-config";
import { getSiteContent } from "@/lib/site-content";

export default async function InteriorDetailingPage() {
  const content = await getSiteContent();
  const config = parsePricingConfig(content.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior);
  return <PricingPageExperience kind="interior" initialConfig={config} />;
}
