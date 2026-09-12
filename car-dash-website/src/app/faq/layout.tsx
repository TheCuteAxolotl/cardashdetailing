import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { SITE_DEFAULTS, normalizeLegacySiteContent } from "@/lib/site-defaults";
import { prisma } from "@/lib/prisma";

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
  const keys = Array.from({ length: 6 }, (_, index) => index + 1).flatMap((number) => [
    `faq${number}Question`,
    `faq${number}Answer`,
  ]);

  let content: Record<string, string> = { ...SITE_DEFAULTS };
  try {
    const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
    content = normalizeLegacySiteContent({
      ...SITE_DEFAULTS,
      ...Object.fromEntries(rows.map((row) => [row.key, row.value])),
    });
  } catch {
    // The visible FAQ page also falls back to SITE_DEFAULTS when the database is unavailable.
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((number) => ({
      "@type": "Question",
      name: content[`faq${number}Question`],
      acceptedAnswer: {
        "@type": "Answer",
        text: content[`faq${number}Answer`],
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
