import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import { breadcrumbSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Interior Car Detailing in South Elgin, IL',
  description: 'Mobile interior detailing for seats, carpets, plastics, glass, crevices, stains, pet hair, and deeper cabin cleanup in South Elgin and nearby suburbs.',
  path: "/interior-detailing",
  keywords: ['interior car detailing South Elgin', 'mobile interior detailing', 'car interior cleaning South Elgin'],
});

const schema = serviceSchema({
  name: 'Interior Car Detailing',
  description: 'Mobile interior detailing for daily drivers, SUVs, trucks, and enthusiast vehicles, with condition-based options for deeper cleanup.',
  path: "/interior-detailing",
  serviceType: 'Interior detailing',
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Interior Car Detailing', path: "/interior-detailing" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      <StructuredData data={schema} />
      {children}
      <RelatedServiceLinks currentPath="/interior-detailing" />
    </>
  );
}
