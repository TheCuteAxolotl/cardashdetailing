import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Customer Reviews',
  description: 'Read customer reviews and feedback for Car Dash Detailing mobile detailing services in South Elgin and nearby suburbs.',
  path: "/reviews",
  keywords: ['Car Dash Detailing reviews', 'detailer reviews South Elgin'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Car Dash Detailing Reviews', path: "/reviews" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
