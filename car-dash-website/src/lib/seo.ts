import type { Metadata } from "next";
import { BUSINESS_PHONE } from "@/lib/constants";

export const SITE_URL = "https://cardashdetailing.com";
export const BUSINESS_NAME = "Car Dash Detailing";
export const BUSINESS_EMAIL = "cardashdetailing.il@gmail.com";

export const SERVICE_AREAS = [
  "Addison, Illinois",
  "Algonquin, Illinois",
  "Arlington Heights, Illinois",
  "Aurora, Illinois",
  "Bartlett, Illinois",
  "Barrington, Illinois",
  "Barrington Hills, Illinois",
  "Batavia, Illinois",
  "Bensenville, Illinois",
  "Bloomingdale, Illinois",
  "Burlington, Illinois",
  "Campton Hills, Illinois",
  "Carpentersville, Illinois",
  "Carol Stream, Illinois",
  "Cary, Illinois",
  "East Dundee, Illinois",
  "Elburn, Illinois",
  "Elmhurst, Illinois",
  "Elgin, Illinois",
  "Elk Grove Village, Illinois",
  "Fox River Grove, Illinois",
  "Geneva, Illinois",
  "Gilberts, Illinois",
  "Glendale Heights, Illinois",
  "Glen Ellyn, Illinois",
  "Hampshire, Illinois",
  "Hanover Park, Illinois",
  "Hoffman Estates, Illinois",
  "Huntley, Illinois",
  "Inverness, Illinois",
  "Itasca, Illinois",
  "Lake in the Hills, Illinois",
  "Lake Zurich, Illinois",
  "Lisle, Illinois",
  "Lombard, Illinois",
  "Long Grove, Illinois",
  "Medinah, Illinois",
  "Mount Prospect, Illinois",
  "Naperville, Illinois",
  "North Aurora, Illinois",
  "North Barrington, Illinois",
  "Oakbrook Terrace, Illinois",
  "Palatine, Illinois",
  "Pingree Grove, Illinois",
  "Prospect Heights, Illinois",
  "Rolling Meadows, Illinois",
  "Roselle, Illinois",
  "Schaumburg, Illinois",
  "Sleepy Hollow, Illinois",
  "South Barrington, Illinois",
  "South Elgin, Illinois",
  "St. Charles, Illinois",
  "Streamwood, Illinois",
  "Villa Park, Illinois",
  "Wayne, Illinois",
  "Warrenville, Illinois",
  "West Chicago, Illinois",
  "West Dundee, Illinois",
  "Wheaton, Illinois",
  "Winfield, Illinois",
  "Wood Dale, Illinois",
];

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: BUSINESS_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: BUSINESS_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/brand-logo.png?v=20261006"),
  image: absoluteUrl("/brand-logo.png?v=20261006"),
  telephone: BUSINESS_PHONE,
  email: BUSINESS_EMAIL,
  priceRange: "$$",
  description:
    "Mobile auto and marine detailing based in South Elgin, Illinois, including interior detailing, exterior detailing, paint correction, ceramic coatings, and marine detailing.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "South Elgin",
    addressRegion: "IL",
    addressCountry: "US",
  },
  areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
  sameAs: [
    "https://www.instagram.com/cardashdetailing",
    "https://www.facebook.com/profile.php?id=61588917429050",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Detailing Services",
    itemListElement: [
      "Interior Detailing",
      "Exterior Detailing",
      "Full Car Detailing",
      "Paint Correction",
      "Ceramic Coating",
      "Marine Detailing",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
};

export function serviceSchema({
  name,
  description,
  path,
  serviceType,
}: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    serviceType: serviceType || name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
