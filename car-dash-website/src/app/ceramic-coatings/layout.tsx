import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import { breadcrumbSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Ceramic Coating in South Elgin, IL',
  description: 'Professional ceramic coating preparation and protection using GYEON and Gtechniq systems. Mobile coating services from Car Dash Detailing in South Elgin and nearby suburbs.',
  path: "/ceramic-coatings",
  keywords: ['ceramic coating South Elgin', 'GYEON coating South Elgin', 'Gtechniq coating Illinois'],
});

const schema = serviceSchema({
  name: 'Ceramic Coating',
  description: 'Professional ceramic coating preparation and protection using GYEON and Gtechniq systems.',
  path: "/ceramic-coatings",
  serviceType: 'Ceramic coating',
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Ceramic Coating', path: "/ceramic-coatings" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      <StructuredData data={schema} />
      {children}
      <RelatedServiceLinks currentPath="/ceramic-coatings" />
    </>
  );
}
