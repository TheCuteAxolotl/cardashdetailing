import { DEFAULT_PRICING_PAGES } from "@/lib/pricing-config";
import { DEFAULT_BOOKING_PRICING } from "@/lib/booking-pricing";

export const SITE_DEFAULTS = {
  heroEyebrow: "Mobile detailing",
  heroTitle: "Clean car. Better drive.",
  heroBody: "Interior, exterior, correction, and protection without overcomplicating it. Pick what the car needs, send the details, and Car Dash handles the rest.",
  heroPrimaryCta: "Get an Exact Quote",
  heroSecondaryCta: "See Services",

  introEyebrow: "The Car Dash approach",
  introTitle: "Straightforward detailing with the details actually handled.",
  introBody: "No giant sales pitch and no mystery add-ons. The vehicle gets looked over, the work gets explained clearly, and the package stays focused on what will make the biggest difference.",

  storyEyebrow: "What matters",
  storyTitle: "The small stuff is what makes the whole car feel finished.",
  storyBody: "Glass, trim, crevices, wheels, interior touch points, paint clarity, and protection all add up. The goal is a result that looks right up close, not just from across the driveway.",

  servicesEyebrow: "Services",
  servicesTitle: "Three ways to get the vehicle handled.",
  servicesBody: "Start with the kind of work you need. Each section has its own packages, pricing, photos, and details so it is easy to compare.",

  galleryEyebrow: "Recent work",
  galleryTitle: "Real cars. Real results.",
  galleryBody: "A look at recent details, corrections, coatings, and cleanup work from Car Dash Detailing.",

  reviewsEyebrow: "Reviews",
  reviewsTitle: "What customers said after the job.",
  reviewsBody: "Live Google reviews and ratings from people who booked Car Dash Detailing.",

  contactEyebrow: "Book a detail",
  contactTitle: "Send the car info. Keep it simple.",
  contactBody: "Choose a service, add the vehicle details, and send the request. Car Dash will follow up with availability and anything that needs to be confirmed.",

  aboutEyebrow: "About Car Dash",
  aboutTitle: "Built around convenience, clean work, and cars that actually look finished.",
  aboutIntro: "Car Dash Detailing is a mobile detailing business based in South Elgin with interior detailing, exterior care, paint correction, and protection services.",
  aboutStoryTitle: "Why Car Dash exists",
  aboutStoryBody: "The idea is simple: make professional detailing easier to book without making customers rearrange their whole day. Mobile service brings the setup to the vehicle, while the work stays focused on quality, communication, and results that make sense for the car.",
  aboutValuesTitle: "What the business is built around",
  aboutValue1Title: "Clear communication",
  aboutValue1Body: "Know what is being done, what it costs, and whether an add-on is actually worth it before the work starts.",
  aboutValue2Title: "Convenient service",
  aboutValue2Body: "Mobile detailing means less time dealing with drop-offs, rides, and waiting around at a shop.",
  aboutValue3Title: "Detail-first work",
  aboutValue3Body: "The finish comes from taking care of the little areas that are easy to rush past.",

  faqEyebrow: "FAQ",
  faqTitle: "Quick answers before booking.",
  faqBody: "The common stuff customers usually want to know before sending a request.",
  faq1Question: "Do you come to the customer?",
  faq1Answer: "Yes. Car Dash Detailing is mobile. Appointment availability can vary by date and service.",
  faq2Question: "How long does a detail take?",
  faq2Answer: "It depends on the vehicle, condition, and package. A lighter detail can take a few hours, while correction or coating work can take much longer.",
  faq3Question: "Do prices change based on condition?",
  faq3Answer: "Package pricing is the starting point. Heavy pet hair, staining, excessive buildup, or other extra work may affect the final price, but that gets discussed before it is added.",
  faq4Question: "Can ceramic-coated vehicles still be detailed?",
  faq4Answer: "Yes. Maintenance washes and coating-safe products can help keep the finish clean and performing properly without unnecessarily stripping protection.",
  faq5Question: "What should be removed before the appointment?",
  faq5Answer: "Personal items, valuables, and anything that could get in the way of cleaning should be removed when possible. Car seats and larger items can be discussed ahead of time.",
  faq6Question: "How do booking requests work?",
  faq6Answer: "Send the vehicle and service details through the booking form. The request is reviewed, then Car Dash follows up to confirm timing, service details, and anything else needed.",


  pricingPackagesConfig: JSON.stringify(DEFAULT_PRICING_PAGES.packages),
  pricingExteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.exterior),
  pricingInteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.interior),
  bookingPricingConfig: JSON.stringify(DEFAULT_BOOKING_PRICING),

  footerBlurb: "Mobile detailing based in South Elgin with interior, exterior, paint correction, and protection services.",
} as const;

export type SiteContentKey = keyof typeof SITE_DEFAULTS;
