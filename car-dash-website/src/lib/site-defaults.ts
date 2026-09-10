export const SITE_DEFAULTS = {
  heroEyebrow: "Mobile detailing · South Elgin",
  heroTitle: "Your car, cleaned up properly.",
  heroBody: "Interior, exterior, correction, and protection without making the whole thing complicated. Car Dash comes to the vehicle and gets it handled.",
  heroPrimaryCta: "Book a Detail",
  heroSecondaryCta: "See Services",
  introEyebrow: "What Car Dash does",
  introTitle: "Good detailing should be easy to book and obvious when it’s done.",
  introBody: "The goal is simple: get the vehicle looking right, keep the process straightforward, and recommend only what actually makes sense for the condition of the car.",
  storyEyebrow: "Why it looks different",
  storyTitle: "The finish comes from the little stuff.",
  storyBody: "Clean glass, proper trim, tight interior areas, paint that actually looks clear, and protection that fits the vehicle. Those details are what pull the whole job together.",
  servicesEyebrow: "Services",
  servicesTitle: "Pick a package. Add what the car actually needs.",
  servicesBody: "Pricing stays clear. If the vehicle needs extra work, it gets discussed before anything is added.",
  galleryEyebrow: "Recent work",
  galleryTitle: "A few cars that came through Car Dash.",
  contactTitle: "Need the car cleaned up? Send the details.",
  contactBody: "Choose a service or send the vehicle info. Car Dash will follow up with availability and anything that needs to be confirmed.",
  footerBlurb: "Mobile detailing based in South Elgin with interior, exterior, paint correction, and protection services for nearby areas.",
} as const;

export type SiteContentKey = keyof typeof SITE_DEFAULTS;
