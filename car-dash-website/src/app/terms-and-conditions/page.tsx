import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Car Dash Detailing",
  description: "Terms and Conditions for Car Dash Detailing.",
};

const effectiveDate = "September 11, 2026";

export default function TermsAndConditionsPage() {
  return (
    <section className="bg-[#070707] px-5 py-20 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[.28em] text-[#FF2D2D]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Terms and Conditions</h1>
        <p className="mt-4 text-sm text-white/45">Effective {effectiveDate}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-7 text-white/68">
          <section>
            <h2 className="text-xl font-semibold text-white">Agreement to these terms</h2>
            <p className="mt-3">
              These Terms and Conditions apply when you use cardashdetailing.com or request services from Car Dash Detailing. By
              using the website or submitting a service request, you agree to these terms. If you do not agree, please do not use
              the website or submit a booking request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Quotes and estimates</h2>
            <p className="mt-3">
              Website estimates are informational and may change after the vehicle and requested work are reviewed. A final quote is
              the specific price presented by Car Dash Detailing for the described work. If the condition, requested work, or scope
              changes, we may provide a revised quote before additional work is performed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Bookings and availability</h2>
            <p className="mt-3">
              Submitting a booking request does not guarantee an appointment until Car Dash Detailing confirms it. Customers are
              responsible for providing accurate contact, vehicle, address, and scheduling information and for ensuring reasonable
              access to the vehicle at the scheduled time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Vehicle condition and personal property</h2>
            <p className="mt-3">
              Please disclose known damage, sensitive aftermarket equipment, electrical problems, loose trim, fragile components,
              or other conditions that could affect the service. Remove valuable or important personal property before service.
              Car Dash Detailing is not responsible for ordinary wear, pre-existing damage, defects, or problems that could not
              reasonably be identified before work began.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Results</h2>
            <p className="mt-3">
              Detailing, stain removal, odor treatment, paint correction, oxidation correction, scratch reduction, and similar
              services improve appearance but do not guarantee complete removal of every defect. Results depend on material,
              condition, age, previous repairs, contamination, and other factors outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Payments and additional work</h2>
            <p className="mt-3">
              The customer is responsible for the agreed price for completed services. Additional work that changes the agreed scope
              or price will be discussed before it is performed whenever reasonably possible. Applicable taxes, fees, or approved
              add-on services may be included in the final amount due.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">SMS terms</h2>
            <p className="mt-3">
              SMS is optional. If you check the SMS consent box on our website, you agree to receive transactional and customer-care
              text messages from Car Dash Detailing regarding quotes, bookings, appointment updates, reminders, and related service
              communications. Message frequency varies. Message and data rates may apply. Consent to SMS is not a condition of
              purchase. Reply STOP to opt out or HELP for help. Wireless carriers are not liable for delayed or undelivered messages.
            </p>
            <p className="mt-3">
              For information about how we handle your information, see our{" "}
              <a className="text-[#FF2D2D] hover:text-[#FF2D2D]" href="/privacy-policy">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Website accounts and acceptable use</h2>
            <p className="mt-3">
              You are responsible for keeping your account credentials secure and for activity performed through your account. You
              may not misuse the website, attempt unauthorized access, interfere with its operation, upload unlawful content, or use
              quote, booking, or support chat to harass, spam, or abuse Car Dash Detailing or other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Changes</h2>
            <p className="mt-3">
              We may update these Terms and Conditions as our website, services, or legal requirements change. The effective date at
              the top of this page will show when these terms were last updated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="mt-3">
              Questions about these Terms and Conditions can be sent to{" "}
              <a className="text-[#FF2D2D] hover:text-[#FF2D2D]" href="mailto:cardashdetailing@gmail.com">
                cardashdetailing@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
