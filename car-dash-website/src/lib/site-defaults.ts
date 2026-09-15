import { DEFAULT_PRICING_PAGES } from "@/lib/pricing-config";
import { DEFAULT_BOOKING_PRICING } from "@/lib/booking-pricing";

export const SITE_DEFAULTS = {
  heroEyebrow: "Mobile detailing · South Elgin, IL",
  heroTitle: "Mobile detailing that comes to you.",
  heroBody: "We’re based in South Elgin and completely mobile. You pick the service. You pick the time. We bring professional detailing directly to your home or workplace.",
  heroPrimaryCta: "Get an Exact Quote",
  heroSecondaryCta: "See Services",

  introEyebrow: "How pricing works",
  introTitle: "We price the work your vehicle actually needs.",
  introBody: "Size matters, but condition matters too. Send us the vehicle, what you want done, and a few photos if you can. We’ll look it over and quote the work instead of automatically charging the biggest package.",

  storyEyebrow: "Why mobile",
  storyTitle: "No shop drop-off. We come to you.",
  storyBody: "You do not have to arrange a ride or leave the vehicle somewhere all day. We bring the detailing setup to your home or location and handle the service there.",

  servicesEyebrow: "Services",
  servicesTitle: "What do you need done?",
  servicesBody: "Start with car detailing, paint and ceramic protection, or marine detailing. From there you can compare the services, prices, and what is included.",

  galleryEyebrow: "Recent work",
  galleryTitle: "Some of our recent work.",
  galleryBody: "Interiors, exterior details, paint correction, ceramic coatings, and cleanup work we have recently completed.",

  reviewsEyebrow: "Google reviews",
  reviewsTitle: "See what customers have said.",
  reviewsBody: "Real Google reviews from customers who booked with Car Dash Detailing.",

  contactEyebrow: "Book a detail",
  contactTitle: "Tell us what you drive and what you want done.",
  contactBody: "Pick the service, vehicle, date, and time that work for you. We’ll review the request and confirm everything before the appointment.",

  aboutEyebrow: "About Car Dash",
  aboutTitle: "Mobile detailing without the shop drop-off.",
  aboutIntro: "Car Dash Detailing is based in South Elgin and completely mobile. We do interior and exterior detailing, paint correction, ceramic coating, and marine detailing.",
  aboutStoryTitle: "Why Car Dash",
  aboutStoryBody: "Car Dash was started to make detailing easier to fit into the day. We come to the vehicle, explain what we recommend, and keep the service focused on what the vehicle actually needs.",
  aboutValuesTitle: "What you can expect from us",
  aboutValue1Title: "Straight answers",
  aboutValue1Body: "We’ll tell you what we recommend, what it costs, and if something extra is actually worth doing before we add it.",
  aboutValue2Title: "We come to you",
  aboutValue2Body: "No shop drop-off or waiting around. We bring the detailing setup to your vehicle and do the work there.",
  aboutValue3Title: "Fair pricing for the condition",
  aboutValue3Body: "A vehicle that is already pretty clean should not automatically cost the same as one that needs hours of extra work.",

  faqEyebrow: "FAQ",
  faqTitle: "A few things people ask us a lot.",
  faqBody: "Quick answers about mobile service, timing, pricing, ceramic coatings, and getting ready for the appointment.",
  faq1Question: "Do you come to me?",
  faq1Answer: "Yes. We’re based in South Elgin and completely mobile. Availability depends on the service, your location, and the date you want.",
  faq2Question: "How long will the detail take?",
  faq2Answer: "It depends on the vehicle, condition, and service. A lighter detail may take a few hours. Deep interior work, paint correction, or ceramic coating prep can take much longer.",
  faq3Question: "Can my quote be lower than the listed SUV or truck price?",
  faq3Answer: "Yes. Size is only part of the job. If your SUV or truck is already pretty clean and needs less work, your exact quote can be lower than the standard package price. Heavy pet hair, stains, buildup, or restoration work can raise it.",
  faq4Question: "Can you detail a car that already has ceramic coating?",
  faq4Answer: "Yes. We can use coating-safe wash methods and compatible protection products to clean it without unnecessarily stripping the coating.",
  faq5Question: "What should I take out of the car before the appointment?",
  faq5Answer: "Please take out valuables, personal items, and anything that blocks the areas you want cleaned when you can. If you have child seats or larger items, just let us know first.",
  faq6Question: "How does the exact quote work?",
  faq6Answer: "Send us your contact info, vehicle, condition, the service you want, and photos if you have them. You do not need an account. We’ll look over the job and send the quote or ask anything else we need to price it correctly.",

  pricingPackagesConfig: JSON.stringify(DEFAULT_PRICING_PAGES.packages),
  pricingExteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.exterior),
  pricingInteriorConfig: JSON.stringify(DEFAULT_PRICING_PAGES.interior),
  bookingPricingConfig: JSON.stringify(DEFAULT_BOOKING_PRICING),

  footerBlurb: "Based in South Elgin and completely mobile. Interior, exterior, paint correction, ceramic coating, and marine detailing.",
} as const;

export type SiteContentKey = keyof typeof SITE_DEFAULTS;
export type SiteContent = Record<SiteContentKey, string>;

// Only replace copy that exactly matches an older Car Dash default. Owner-written custom
// content is left untouched, so upgrading the site never silently overwrites a custom edit.
const LEGACY_COPY_REPLACEMENTS: Record<string, string> = {
  "We’re based in South Elgin and completely mobile. Interior, exterior, paint correction, ceramic coating, and marine detailing — we bring the setup to you.": SITE_DEFAULTS.heroBody,
  // v5.4.3 defaults -> v5.4.4 human-voice copy. Custom owner-written text is still preserved.
  'Interior detailing, exterior care, paint correction, and ceramic protection brought to your vehicle in South Elgin and nearby suburbs.': SITE_DEFAULTS.heroBody,
  'How Car Dash prices the job': SITE_DEFAULTS.introEyebrow,
  'A detail based on the vehicle in front of us.': SITE_DEFAULTS.introTitle,
  'Vehicle size matters, but condition matters too. We look at what actually needs cleaning, correction, or protection, explain the work clearly, and price the job around the time and effort it needs.': SITE_DEFAULTS.introBody,
  'Professional detailing without the shop drop-off.': SITE_DEFAULTS.storyTitle,
  'Car Dash brings the detailing setup to you. That means less time arranging rides or sitting at a shop, while the vehicle still gets the careful interior, exterior, paint, and protection work the service calls for.': SITE_DEFAULTS.storyBody,
  'Choose the kind of work your vehicle needs.': SITE_DEFAULTS.servicesTitle,
  'Start with car detailing, paint and protection, or marine detailing. Each section explains the work, pricing approach, and what makes a vehicle need more or less labor.': SITE_DEFAULTS.servicesBody,
  'See the work before you book.': SITE_DEFAULTS.galleryTitle,
  'Recent interiors, exterior details, corrections, coatings, and cleanup work completed by Car Dash Detailing.': SITE_DEFAULTS.galleryBody,
  'Feedback from Car Dash customers.': SITE_DEFAULTS.reviewsTitle,
  'Recent customer feedback and ratings for Car Dash Detailing.': SITE_DEFAULTS.reviewsBody,
  'Appointment request': SITE_DEFAULTS.contactEyebrow,
  'Tell us what you drive and what it needs.': SITE_DEFAULTS.contactTitle,
  'Send the vehicle, service, and preferred appointment details. Car Dash will review the request and confirm the timing, price, and anything else that matters before the appointment.': SITE_DEFAULTS.contactBody,
  'Mobile detailing built around convenience and careful work.': SITE_DEFAULTS.aboutTitle,
  'Car Dash Detailing is a mobile detailing business based in South Elgin, Illinois, serving customers with interior detailing, exterior care, paint correction, ceramic protection, and marine detailing.': SITE_DEFAULTS.aboutIntro,
  'Why Car Dash exists': SITE_DEFAULTS.aboutStoryTitle,
  'Car Dash was built to make professional detailing easier to fit into a normal day. The service comes to the vehicle, the work is explained clearly, and the recommendation is based on what the vehicle actually needs instead of automatically pushing the biggest package.': SITE_DEFAULTS.aboutStoryBody,
  'What customers can expect': SITE_DEFAULTS.aboutValuesTitle,
  'Clear communication': SITE_DEFAULTS.aboutValue1Title,
  'You should know what is being done, what it costs, and whether extra work is actually needed before it is added.': SITE_DEFAULTS.aboutValue1Body,
  'Mobile convenience': SITE_DEFAULTS.aboutValue2Title,
  'The detailing setup comes to the vehicle, reducing the need for shop drop-offs, rides, and waiting around.': SITE_DEFAULTS.aboutValue2Body,
  'Condition-based work': SITE_DEFAULTS.aboutValue3Title,
  'A vehicle that is already in good shape should not automatically be treated like one that needs hours of extra cleanup.': SITE_DEFAULTS.aboutValue3Body,
  'What to know before the appointment.': SITE_DEFAULTS.faqTitle,
  'Quick answers about mobile service, timing, condition-based pricing, coatings, and getting the vehicle ready.': SITE_DEFAULTS.faqBody,
  'Do you come to the customer?': SITE_DEFAULTS.faq1Question,
  'Yes. Car Dash Detailing is mobile and is based in South Elgin. Appointment availability depends on the service, location, and date.': SITE_DEFAULTS.faq1Answer,
  'How long does a detail take?': SITE_DEFAULTS.faq2Question,
  'It depends on vehicle size, condition, and the service. A lighter job may take a few hours, while deeper interior work, paint correction, or coating preparation can take much longer.': SITE_DEFAULTS.faq2Answer,
  'Can the final price be lower than the listed SUV or truck price?': SITE_DEFAULTS.faq3Question,
  'Yes. Vehicle class is only part of the workload. If an SUV or truck is already fairly clean and needs less labor, an exact quote can come in below the standard package reference price. Heavy pet hair, staining, buildup, or restoration work can move it the other direction.': SITE_DEFAULTS.faq3Answer,
  'Can ceramic-coated vehicles still be detailed?': SITE_DEFAULTS.faq4Question,
  'Yes. Coating-safe maintenance washes and compatible protection products can keep the finish clean and help maintain water behavior without unnecessarily stripping the existing coating.': SITE_DEFAULTS.faq4Answer,
  'What should I remove before the appointment?': SITE_DEFAULTS.faq5Question,
  'Please remove valuables, personal items, and anything that blocks access to the areas being cleaned when possible. Child seats or larger items can be discussed before the appointment.': SITE_DEFAULTS.faq5Answer,
  'How do exact quote requests work?': SITE_DEFAULTS.faq6Question,
  'Send your contact information, vehicle details, condition, requested service, and photos if you have them. No account is required to submit the request. Car Dash reviews the actual job and follows up with the quote or any questions needed to price it accurately.': SITE_DEFAULTS.faq6Answer,
  'Mobile detailing based in South Elgin, Illinois, with interior, exterior, paint correction, ceramic protection, and marine services.': SITE_DEFAULTS.footerBlurb,
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

const LEGACY_PRICING_COPY_REPLACEMENTS: Record<string, string> = {
  "Complete detailing packages with a clear price before you book.": "Pick a full-detail package and your vehicle size.",
  "Pick your vehicle type, compare what is included, and book the package that matches the level of reset you want.": "Choose your vehicle size, compare what is included, and pick the package that fits what you want done.",
  "A straightforward inside-and-out reset for a regularly maintained vehicle.": "A basic inside-and-out clean for a vehicle that is already kept up pretty well.",
  "A deeper full-vehicle detail with added decontamination and protection.": "A more complete interior + exterior detail with extra cleaning and paint protection.",
  "The full reset plus a light machine paint enhancement for extra gloss and clarity.": "Everything in the full detail plus a light machine polish for more gloss and clarity.",
  "Reserve Signature Detail": "Book Signature Detail",
  "Exterior packages built around the finish you want.": "Exterior detailing from a maintenance wash to paint enhancement.",
  "Choose the vehicle type first, then select a fixed-price exterior service from maintenance washing through paint enhancement.": "Choose your vehicle size, then pick anything from a maintenance wash to a full exterior detail or paint enhancement.",
  "A safe exterior refresh for vehicles that are already in good condition.": "A maintenance wash for vehicles that are already in good condition.",
  "A deeper exterior clean with chemical decontamination and paint protection.": "A deeper exterior clean with decontamination and paint protection.",
  "Exterior decontamination plus a single-stage machine enhancement for added gloss and clarity.": "Full exterior prep plus a one-step machine polish for more gloss and clarity.",
  "Reserve Paint Enhancement": "Book Paint Enhancement",
  "Interior packages from a clean refresh to a deep reset.": "Interior detailing from a quick refresh to a deep clean.",
  "Choose the vehicle type, compare the level of cleaning, and book with the exact package price shown.": "Choose your vehicle size and how much cleaning the interior needs.",
  "A clean-up for regularly maintained interiors that need the basics handled well.": "A lighter clean for interiors that are already kept up pretty well.",
  "A thorough interior detail for vehicles that need more than a maintenance clean.": "A full interior detail when the cabin needs more than a quick cleanup.",
  "A more intensive reset for neglected interiors, stains, and heavier buildup.": "A deeper clean for stains, neglected interiors, and heavier buildup.",
  "Reserve Deep Interior Reset": "Book Deep Interior Reset",
};

function normalizeLegacyPricingCopy(value: string) {
  try {
    const parsed = JSON.parse(value);
    const walk = (item: unknown): unknown => {
      if (typeof item === "string") return LEGACY_PRICING_COPY_REPLACEMENTS[item] || item;
      if (Array.isArray(item)) return item.map(walk);
      if (item && typeof item === "object") {
        return Object.fromEntries(Object.entries(item as Record<string, unknown>).map(([key, nested]) => [key, walk(nested)]));
      }
      return item;
    };
    return JSON.stringify(walk(parsed));
  } catch {
    return value;
  }
}

export function normalizeLegacySiteContent<T extends Record<string, string>>(content: T): T {
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => {
      const normalized = LEGACY_COPY_REPLACEMENTS[value] || value;
      if (key === "pricingPackagesConfig" || key === "pricingExteriorConfig" || key === "pricingInteriorConfig") {
        return [key, normalizeLegacyPricingCopy(normalized)];
      }
      return [key, normalized];
    })
  ) as T;
}
