import type { Metadata } from "next";
import HomeExperience from "@/components/HomeExperience";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl, pageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mobile Detailing in South Elgin, IL",
  description:
    "Car Dash Detailing provides mobile interior and exterior detailing, paint correction, ceramic protection, and marine detailing in South Elgin and nearby suburbs.",
  path: "/",
  keywords: [
    "mobile detailing South Elgin",
    "car detailing South Elgin",
    "interior detailing South Elgin",
    "paint correction South Elgin",
    "ceramic coating South Elgin",
  ],
});

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Car Dash Detailing",
  publisher: { "@id": `${SITE_URL}/#business` },
  potentialAction: {
    "@type": "CommunicateAction",
    target: absoluteUrl("/quote"),
    name: "Get an Exact Quote",
  },
};

export default function Home() {
  return (
    <>
      <StructuredData data={websiteSchema} />
      <HomeExperience />
    </>
  );
}
