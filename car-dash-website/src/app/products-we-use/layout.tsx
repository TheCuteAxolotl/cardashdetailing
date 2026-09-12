import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Professional Detailing Products We Use',
  description: 'See the professional detailing chemistry and product approach used by Car Dash Detailing for interiors, exteriors, paint correction, and protection.',
  path: "/products-we-use",
  keywords: ['professional detailing products', 'Koch Chemie detailing South Elgin'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Professional Detailing Products We Use', path: "/products-we-use" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
