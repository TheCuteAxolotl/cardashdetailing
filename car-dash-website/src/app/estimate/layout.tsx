import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Instant Detailing Estimate',
  description: 'Get a quick detailing estimate based on vehicle class and service selection, then request an exact condition-based quote from Car Dash Detailing.',
  path: "/estimate",
  keywords: ['car detailing estimate South Elgin', 'detailing price estimate'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Instant Detailing Estimate', path: "/estimate" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
