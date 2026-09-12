import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description: 'Call, text, or send a booking request to Car Dash Detailing for mobile detailing in South Elgin and surrounding suburbs.',
  path: "/contact",
  keywords: ['contact Car Dash Detailing', 'mobile detailer South Elgin phone'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Contact Car Dash Detailing', path: "/contact" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
