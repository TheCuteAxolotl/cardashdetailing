import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import { breadcrumbSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Mobile Marine Detailing in South Elgin, IL',
  description: 'Mobile boat and marine detailing including interior cleanup, hull care, deck care, enhancement, and protection services in the South Elgin and Fox Valley area.',
  path: "/marine-detailing",
  keywords: ['marine detailing South Elgin', 'boat detailing Fox Valley', 'mobile boat detailing Illinois'],
});

const schema = serviceSchema({
  name: 'Marine Detailing',
  description: 'Mobile marine detailing including interior, hull, deck, maintenance, enhancement, and protection services.',
  path: "/marine-detailing",
  serviceType: 'Marine detailing',
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Mobile Marine Detailing', path: "/marine-detailing" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      <StructuredData data={schema} />
      {children}
      <RelatedServiceLinks currentPath="/marine-detailing" />
    </>
  );
}
