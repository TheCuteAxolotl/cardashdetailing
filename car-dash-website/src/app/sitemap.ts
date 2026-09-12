import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ["/", 1, "weekly"],
    ["/services", 0.9, "weekly"],
    ["/car-detailing-packages", 0.9, "weekly"],
    ["/interior-detailing", 0.9, "weekly"],
    ["/exterior-detailing", 0.9, "weekly"],
    ["/paint-correction", 0.9, "monthly"],
    ["/ceramic-coatings", 0.9, "monthly"],
    ["/marine-detailing", 0.8, "monthly"],
    ["/gallery", 0.8, "weekly"],
    ["/reviews", 0.8, "weekly"],
    ["/about", 0.7, "monthly"],
    ["/faq", 0.7, "monthly"],
    ["/contact", 0.8, "monthly"],
    ["/quote", 0.9, "monthly"],
    ["/estimate", 0.7, "monthly"],
    ["/products-we-use", 0.6, "monthly"],
    ["/privacy-policy", 0.2, "yearly"],
    ["/terms-and-conditions", 0.2, "yearly"],
  ] as const;

  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
