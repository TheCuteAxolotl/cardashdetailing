import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Car Dash Detailing",
  description: "Privacy Policy for Car Dash Detailing.",
};

const effectiveDate = "September 11, 2026";

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-[#070707] px-5 py-20 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[.28em] text-red-400">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-white/45">Effective {effectiveDate}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-7 text-white/68">
          <section>
            <h2 className="text-xl font-semibold text-white">Overview</h2>
            <p className="mt-3">
              Car Dash Detailing respects your privacy. This Privacy Policy explains what information we collect through
              cardashdetailing.com, how we use it, and the choices available to you when you request a quote, book a service,
              create an account, use support or quote chat, or otherwise contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Information we collect</h2>
            <p className="mt-3">
              Depending on how you use the website, we may collect information such as your name, email address, phone number,
              account information, vehicle details, service selections, appointment preferences, service address, quote and support
              messages, photos you choose to upload, booking history, and other information you provide to us. We may also collect
              limited technical and security information needed to operate and protect the website, such as authentication data,
              device or browser information, and network identifiers used for fraud or abuse prevention.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">How we use information</h2>
            <p className="mt-3">
              We use information to provide and improve our detailing services, respond to quote and support requests, manage
              customer accounts and saved vehicles, schedule and manage bookings, communicate about appointments, maintain service
              and warranty records, prevent abuse, troubleshoot the website, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">SMS and mobile information</h2>
            <p className="mt-3">
              If you separately opt in to SMS, Car Dash Detailing may send transactional or customer-care text messages related to
              your quote, booking, appointment, or service. Message frequency varies. Message and data rates may apply. Reply STOP
              to opt out or HELP for help.
            </p>
            <p className="mt-3">
              Mobile information, including phone numbers and SMS opt-in data or consent, will not be sold or shared with third
              parties or affiliates for their marketing or promotional purposes. We may share information with service providers
              that help us deliver requested communications or operate our services, but text messaging originator opt-in data and
              consent will not be shared with third parties for their own marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Service providers</h2>
            <p className="mt-3">
              We may use service providers to host the website, store data, deliver email or SMS communications, process website
              requests, or provide other infrastructure. These providers may process information only as needed to perform services
              for Car Dash Detailing and are subject to their own privacy and security obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Cookies and authentication</h2>
            <p className="mt-3">
              The website may use cookies or similar browser storage that are necessary for features such as account login,
              authentication, security, and site preferences. We do not use SMS consent as a condition of purchasing or requesting
              a service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Data retention and security</h2>
            <p className="mt-3">
              We retain information for as long as reasonably necessary to provide services, maintain business and warranty records,
              resolve disputes, enforce agreements, and meet legal obligations. We use reasonable administrative and technical
              safeguards, but no internet service or storage system can be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Your choices</h2>
            <p className="mt-3">
              You may choose not to opt in to SMS and can still request or purchase services. If you have opted in to SMS, you can
              reply STOP to unsubscribe at any time. You may contact us to ask questions about your information or request updates
              to information you have provided, subject to legal and recordkeeping requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Changes to this policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy as our services or legal requirements change. The effective date at the top of this
              page will show when the policy was last updated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Contact us</h2>
            <p className="mt-3">
              Questions about this Privacy Policy can be sent to{" "}
              <a className="text-red-400 hover:text-red-300" href="mailto:cardashdetailing@gmail.com">
                cardashdetailing@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
