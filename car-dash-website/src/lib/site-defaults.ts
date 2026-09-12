import { DEFAULT_PRICING_PAGES } from "@/lib/pricing-config";
import { DEFAULT_BOOKING_PRICING } from "@/lib/booking-pricing";

export const SITE_DEFAULTS = {
  heroEyebrow: "Mobile detailing · South Elgin, IL",
  heroTitle: "Mobile detailing that comes to you.",
  heroBody: "Interior detailing, exterior care, paint correction, and ceramic protection brought to your vehicle in South Elgin and nearby suburbs.",
  heroPrimaryCta: "Get an Exact Quote",
  heroSecondaryCta: "See Services",

  introEyebrow: "How Car Dash prices the job",
  introTitle: "A detail based on the vehicle in front of us.",
  introBody: "Vehicle size matters, but condition matters too. We look at what actually needs cleaning, correction, or protection, explain the work clearly, and price the job around the time and effort it needs.",

  storyEyebrow: "Why mobile",
  storyTitle: "Professional detailing without the shop drop-off.",
  storyBody: "Car Dash brings the detailing setup to you. That means less time arranging rides or sitting at a shop, while the vehicle still gets the careful interior, exterior, paint, and protection work the service calls for.",

  servicesEyebrow: "Services",
  servicesTitle: "Choose the kind of work your vehicle needs.",
  servicesBody: "Start with car detailing, paint and protection, or marine detailing. Each section explains the work, pricing approach, and what makes a vehicle need more or less labor.",

  galleryEyebrow: "Recent work",
  galleryTitle: "See the work before you book.",
  galleryBody: "Recent interiors, exterior details, corrections, coatings, and cleanup work completed by Car Dash Detailing.",

  reviewsEyebrow: "Google reviews",
  reviewsTitle: "Feedback from Car Dash customers.",
  reviewsBody: "Recent customer feedback and ratings for Car Dash Detailing.",

  contactEyebrow: "Appointment request",
  contactTitle: "Tell us what you drive and what it needs.",
  contactBody: "Send the vehicle, service, and preferred appointment details. Car Dash will review the request and confirm the timing, price, and anything else that matters before the appointment.",

  aboutEyebrow: "About Car Dash",
  aboutTitle: "Mobile detailing built around convenience and careful work.",
  aboutIntro: "Car Dash Detailing is a mobile detailing business based in South Elgin, Illinois, serving customers with interior detailing, exterior care, paint correction, ceramic protection, and marine detailing.",
  aboutStoryTitle: "Why Car Dash exists",
  aboutStoryBody: "Car Dash was built to make professional detailing easier to fit into a normal day. The service comes to the vehicle, the work is explained clearly, and the recommendation is based on what the vehicle actually needs instead of automatically pushing the biggest package.",
  aboutValuesTitle: "What customers can expect",
  aboutValue1Title: "Clear communication",
  aboutValue1Body: "You should know what is being done, what it costs, and whether extra work is actually needed before it is added.",
  aboutValue2Title: "Mobile convenience",
  aboutValue2Body: "The detailing setup comes to the vehicle, reducing the need for shop drop-offs, rides, and waiting around.",
  aboutValue3Title: "Condition-based work",
  aboutValue3Body: "A vehicle that is already in good shape should not automatically be treated like one that needs hours of extra cleanup.",

  faqEyebrow: "FAQ",
  faqTitle: "What to know before the appointment.",
  faqBody: "Quick answers about mobile service, timing, condition-based pricing, coatings, and getting the vehicle ready.",
  faq1Question: "Do you come to the customer?",
  faq1Answer: "Yes. Car Dash Detailing is mobile and is based in South Elgin. Appointment availability depends on the service, location, and date.",
  faq2Question: "How long does a detail take?",
  faq2Answer: "It depends on vehicle size, condition, and the service. A lighter job may take a few hours, while deeper interior work, paint correction, or coating preparation can take much longer.",
  faq3Question: "Can the final price be lower than the listed SUV or truck price?",
  faq3Answer: "Yes. Vehicle class is only part of the workload. If an SUV or truck is already fairly clean and needs less labor, an exact quote can come in below the standard package reference price. Heavy pet hair, staining, buildup, or restoration work can move it the other direction.",
  faq4Question: "Can ceramic-coated vehicles still be detailed?",
  faq4Answer: "Yes. Coating-safe maintenance washes and compatible protection products can keep the finish clean and help maintain water behavior without unnecessarily stripping the existing coating.",
  faq5Question: "What should I remove before the appointment?",
  faq5Answer: "Please remove valuables, personal items, and anything that blocks access to the areas being cleaned when possible. Child seats or larger items can be discussed before the appointment.",
  faq6Question: "How do exact quote requests work?",
  faq6Answer: "Send your contact information, vehicle details, condition, requested service, and photos if you have them. No account is required to submit the request. Car Dash reviews the actual job and follows up with the quote or any questions needed to price it accurately.",

  pricingPackagesConfig: JSON.stringify(DEFAULT_PRICING_PAGES.packages),
  pricingExteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.exterior),
  pricingInteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.interior),
  bookingPricingConfig: JSON.stringify(DEFAULT_BOOKING_PRICING),

  footerBlurb: "Mobile detailing based in South Elgin, Illinois, with interior, exterior, paint correction, ceramic protection, and marine services.",
} as const;

export type SiteContentKey = keyof typeof SITE_DEFAULTS;

// Only replace copy that exactly matches an older Car Dash default. Owner-written custom
// content is left untouched, so upgrading the site never silently overwrites a custom edit.
const LEGACY_COPY_REPLACEMENTS: Record<string, string> = {
  "Mobile detailing": SITE_DEFAULTS.heroEyebrow,
  "Clean car. Better drive.": SITE_DEFAULTS.heroTitle,
  "Interior, exterior, correction, and protection without overcomplicating it. Pick what the car needs, send the details, and Car Dash handles the rest.": SITE_DEFAULTS.heroBody,
  "The Car Dash approach": SITE_DEFAULTS.introEyebrow,
  "Straightforward detailing with the details actually handled.": SITE_DEFAULTS.introTitle,
  "No giant sales pitch and no mystery add-ons. The vehicle gets looked over, the work gets explained clearly, and the package stays focused on what will make the biggest difference.": SITE_DEFAULTS.introBody,
  "What matters": SITE_DEFAULTS.storyEyebrow,
  "The small stuff is what makes the whole car feel finished.": SITE_DEFAULTS.storyTitle,
  "Glass, trim, crevices, wheels, interior touch points, paint clarity, and protection all add up. The goal is a result that looks right up close, not just from across the driveway.": SITE_DEFAULTS.storyBody,
  "Three ways to get the vehicle handled.": SITE_DEFAULTS.servicesTitle,
  "Start with the kind of work you need. Each section has its own packages, pricing, photos, and details so it is easy to compare.": SITE_DEFAULTS.servicesBody,
  "Real cars. Real results.": SITE_DEFAULTS.galleryTitle,
  "A look at recent details, corrections, coatings, and cleanup work from Car Dash Detailing.": SITE_DEFAULTS.galleryBody,
  "What customers said after the job.": SITE_DEFAULTS.reviewsTitle,
  "Live Google reviews and ratings from people who booked Car Dash Detailing.": SITE_DEFAULTS.reviewsBody,
  "Send the car info. Keep it simple.": SITE_DEFAULTS.contactTitle,
  "Choose a service, add the vehicle details, and send the request. Car Dash will follow up with availability and anything that needs to be confirmed.": SITE_DEFAULTS.contactBody,
};

export function normalizeLegacySiteContent<T extends Record<string, string>>(content: T): T {
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => [key, LEGACY_COPY_REPLACEMENTS[value] || value])
  ) as T;
}
