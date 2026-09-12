import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Mobile Detailing Services in South Elgin, IL',
  description: 'Explore Car Dash Detailing services for full car detailing, interior and exterior detailing, paint correction, ceramic protection, add-ons, and marine detailing.',
  path: "/services",
  keywords: ['detailing services South Elgin', 'mobile detailer South Elgin', 'car detailing services Illinois'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Mobile Detailing Services', path: "/services" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
