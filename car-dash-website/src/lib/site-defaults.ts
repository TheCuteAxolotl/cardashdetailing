export const SITE_DEFAULTS = {
  heroEyebrow: "South Elgin • Mobile Detailing",
  heroTitle: "Clean work. Sharp finish. No shop wait.",
  heroBody: "Mobile detailing built around convenience, careful work, and results that make the vehicle feel finished again.",
  heroPrimaryCta: "Book a Detail",
  heroSecondaryCta: "View Services",
  introEyebrow: "Car Dash Detailing",
  introTitle: "Detailing that fits the car — and your schedule.",
  introBody: "Interior resets, exterior details, paint correction, and protection are handled with a simple goal: make the vehicle look noticeably better without making the process complicated.",
  storyEyebrow: "Built Around The Finish",
  storyTitle: "The small details are what make the whole car look right.",
  storyBody: "From the trim and glass to the paint and tight interior areas, Car Dash Detailing focuses on the parts that separate a quick clean from a finished result.",
  servicesEyebrow: "Services",
  servicesTitle: "Choose what the vehicle needs.",
  servicesBody: "Packages, pricing, and descriptions shown here are kept current through the Owner Dashboard.",
  galleryEyebrow: "Selected Work",
  galleryTitle: "Recent details, corrections, and protection work.",
  contactTitle: "Ready to get the vehicle taken care of?",
  contactBody: "Book online or email Car Dash Detailing for availability, pricing, and help choosing the right service.",
  footerBlurb: "Mobile detailing based in South Elgin, serving surrounding areas with interior, exterior, paint-care, and protection services.",
} as const;

export type SiteContentKey = keyof typeof SITE_DEFAULTS;
