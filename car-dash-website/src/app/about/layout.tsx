import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'About Car Dash',
  description: 'Learn about Car Dash Detailing, a mobile detailing business based in South Elgin focused on convenient service, clear communication, paint care, and finished details.',
  path: "/about",
  keywords: ['Car Dash Detailing South Elgin'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'About Car Dash Detailing', path: "/about" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
