import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: 'Get an Exact Detailing Quote',
  description: 'Send your vehicle details, condition, service needs, and photos to Car Dash Detailing for a condition-based exact quote without creating an account first.',
  path: "/quote",
  keywords: ['car detailing quote South Elgin', 'mobile detailing estimate', 'exact detailing quote'],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: 'Get an Exact Detailing Quote', path: "/quote" },
]);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={breadcrumbs} />
      {children}
    </>
  );
}
