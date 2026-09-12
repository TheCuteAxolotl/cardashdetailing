import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import { breadcrumbSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Car Detailing Packages in South Elgin, IL',
  description: 'Mobile full-detail packages from Car Dash Detailing for cars, SUVs, and trucks in South Elgin and nearby suburbs. Compare interior + exterior package options and request an exact quote.',
  path: "/car-detailing-packages",
  keywords: ['car detailing packages South Elgin', 'mobile car detailing Illinois', 'full car detail South Elgin'],
});

const schema = serviceSchema({
  name: 'Car Detailing Packages',
  description: 'Mobile full-vehicle detailing packages combining interior and exterior care for cars, SUVs, and trucks.',
  path: "/car-detailing-packages",
  serviceType: 'Car detailing',
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Car Detailing Packages', path: "/car-detailing-packages" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      <StructuredData data={schema} />
      {children}
      <RelatedServiceLinks currentPath="/car-detailing-packages" />
    </>
  );
}
