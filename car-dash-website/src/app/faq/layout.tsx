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

  const faqItems = [
    { question: content.faq1Question, answer: content.faq1Answer },
    { question: content.faq2Question, answer: content.faq2Answer },
    { question: content.faq3Question, answer: content.faq3Answer },
    { question: content.faq4Question, answer: content.faq4Answer },
    { question: content.faq5Question, answer: content.faq5Answer },
    { question: content.faq6Question, answer: content.faq6Answer },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
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
