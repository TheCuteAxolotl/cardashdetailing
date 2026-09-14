export type MediaPlacement = {
  value: string;
  label: string;
  group: string;
  photoOnly?: boolean;
};

export const STATIC_MEDIA_PLACEMENTS: MediaPlacement[] = [
  { value: "gallery", label: "Public Gallery → Main Gallery", group: "Public Gallery" },
  { value: "before-after", label: "Public Gallery → Before & After", group: "Public Gallery" },
  { value: "portfolio", label: "Public Gallery → Portfolio", group: "Public Gallery" },

  { value: "home-360", label: "Homepage → 360 Hero Viewer → Rotation Frames", group: "Homepage", photoOnly: true },
  { value: "hero", label: "Global Fallback → Hero Photo", group: "Fallback Media", photoOnly: true },
  { value: "home-showcase-primary", label: "Homepage → Work Showcase → Primary", group: "Homepage" },
  { value: "home-showcase-secondary", label: "Homepage → Work Showcase → Secondary", group: "Homepage" },
  { value: "home-story", label: "Homepage → Work Showcase → Story", group: "Homepage" },
  { value: "home-services-bg", label: "Homepage → Prices Section Media", group: "Homepage" },
  { value: "home-cta-bg", label: "Homepage → Booking Section Media", group: "Homepage" },

  { value: "pricing-car-packages-hero", label: "Car Detailing Packages → Hero Photo", group: "Car Detailing Packages", photoOnly: true },
  { value: "pricing-car-packages-intro", label: "Car Detailing Packages → Intro Media", group: "Car Detailing Packages" },
  { value: "pricing-car-packages-results", label: "Car Detailing Packages → Results Media", group: "Car Detailing Packages" },

  { value: "pricing-exterior-hero", label: "Exterior Detailing → Hero Photo", group: "Exterior Detailing", photoOnly: true },
  { value: "pricing-exterior-intro", label: "Exterior Detailing → Intro Media", group: "Exterior Detailing" },
  { value: "pricing-exterior-results", label: "Exterior Detailing → Results Media", group: "Exterior Detailing" },

  { value: "pricing-interior-hero", label: "Interior Detailing → Hero Photo", group: "Interior Detailing", photoOnly: true },
  { value: "pricing-interior-intro", label: "Interior Detailing → Intro Media", group: "Interior Detailing" },
  { value: "pricing-interior-results", label: "Interior Detailing → Results Media", group: "Interior Detailing" },

  { value: "services-hero", label: "All Services → Hero Photo", group: "All Services", photoOnly: true },
  { value: "services-media", label: "All Services → Page Media", group: "All Services" },

  { value: "marine-hero", label: "Marine Detailing → Hero Photo", group: "Marine Detailing", photoOnly: true },
  { value: "marine-services", label: "Marine Detailing → Services Media", group: "Marine Detailing" },
  { value: "marine-results", label: "Marine Detailing → Results Media", group: "Marine Detailing" },

  { value: "gallery-hero", label: "Gallery → Hero Photo", group: "Other Pages", photoOnly: true },
  { value: "reviews-hero", label: "Reviews → Hero Photo", group: "Other Pages", photoOnly: true },
  { value: "reviews-media", label: "Reviews → Customer Work Media", group: "Other Pages" },
  { value: "contact-hero", label: "Booking / Contact → Hero Photo", group: "Other Pages", photoOnly: true },
  { value: "contact-media", label: "Booking / Contact → Page Media", group: "Other Pages" },
  { value: "faq-hero", label: "FAQ → Hero Photo", group: "Other Pages", photoOnly: true },
  { value: "faq-media", label: "FAQ → Page Media", group: "Other Pages" },
  { value: "quote-media", label: "Exact Quote → Page Media", group: "Other Pages" },
  { value: "estimate-media", label: "Instant Estimate → Page Media", group: "Other Pages" },

  { value: "about-hero", label: "About Car Dash → Hero Photo", group: "Explore Pages", photoOnly: true },
  { value: "about-story", label: "About Car Dash → Story Media", group: "Explore Pages" },
  { value: "about-values-bg", label: "About Car Dash → Values Media", group: "Explore Pages" },
  { value: "paint-correction-hero", label: "Paint Correction → Hero Photo", group: "Explore Pages", photoOnly: true },
  { value: "paint-correction-results", label: "Paint Correction → Results Media", group: "Explore Pages" },
  { value: "ceramic-coatings-hero", label: "Ceramic Coatings → Hero Photo", group: "Explore Pages", photoOnly: true },
  { value: "ceramic-results", label: "Ceramic Coatings → Results Media", group: "Explore Pages" },
  { value: "products-hero", label: "Products We Use → Hero Photo", group: "Explore Pages", photoOnly: true },
  { value: "products-gallery", label: "Products We Use → Product Media", group: "Explore Pages" },
];

export const STATIC_MEDIA_PLACEMENT_MAP = new Map(STATIC_MEDIA_PLACEMENTS.map((item) => [item.value, item]));

export function isPhotoOnlyMediaCategory(category: string) {
  return STATIC_MEDIA_PLACEMENT_MAP.get(category)?.photoOnly === true || category === "hero" || category.endsWith("-hero");
}

export function getMediaPlacementPath(category: string): string | null {
  if (["gallery", "before-after", "portfolio", "gallery-hero"].includes(category)) return "/gallery";
  if (category === "reviews-hero" || category === "reviews-media") return "/reviews";
  if (category === "contact-hero" || category === "contact-media") return "/contact";
  if (category === "faq-hero" || category === "faq-media") return "/faq";
  if (category === "quote-media") return "/quote";
  if (category === "estimate-media") return "/estimate";
  if (category.startsWith("about-")) return "/about";
  if (category.startsWith("paint-correction-")) return "/paint-correction";
  if (category.startsWith("ceramic-coatings-") || category === "ceramic-results") return "/ceramic-coatings";
  if (category.startsWith("products-")) return "/products-we-use";
  if (category.startsWith("marine-")) return "/marine-detailing";
  if (category.startsWith("services-")) return "/services";
  if (category.startsWith("pricing-car-packages-")) return "/car-detailing-packages";
  if (category.startsWith("pricing-exterior-")) return "/exterior-detailing";
  if (category.startsWith("pricing-interior-")) return "/interior-detailing";
  if (category.startsWith("service-")) return "/#specialty-prices";
  if (category.startsWith("home-")) return "/";
  if (category === "hero") return null;
  return null;
}
