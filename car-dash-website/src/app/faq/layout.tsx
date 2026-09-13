import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Mobile Detailing FAQ",
  description:
    "Answers about mobile detailing appointments, pricing by condition, ceramic-coated vehicles, appointment prep, and booking with Car Dash Detailing.",
  path: "/faq",
  keywords: ["detailing FAQ", "mobile detailing questions", "Car Dash Detailing FAQ"],
});

const breadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
]);

async function getFaqSchema() {
  const content = await getSiteContent();

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((number) => ({
      "@type": "Question",
      name: content[`faq${number}Question` as keyof typeof content],
      acceptedAnswer: {
        "@type": "Answer",
        text: content[`faq${number}Answer` as keyof typeof content],
      },
    })),
  };
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const faqSchema = await getFaqSchema();
  return (
    <>
      <StructuredData data={breadcrumbs} />
      <StructuredData data={faqSchema} />
      {children}
    </>
  );
}
