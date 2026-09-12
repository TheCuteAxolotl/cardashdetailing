import BookingForm from "@/components/BookingForm";
import PublicHero from "@/components/PublicHero";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY } from "@/lib/constants";

const EMAIL = "cardashdetailing@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PublicHero imageCategory="contact-hero" eyebrowKey="contactEyebrow" titleKey="contactTitle" bodyKey="contactBody" action={<div className="flex flex-wrap gap-3"><a href={`tel:${BUSINESS_PHONE}`} className="inline-flex rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] transition hover:brightness-95">Call {BUSINESS_PHONE_DISPLAY}</a><a href={`sms:${BUSINESS_PHONE}`} className="inline-flex rounded-full border border-white/18 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur hover:border-white/35 hover:text-white">Text us</a><a href={`mailto:${EMAIL}`} className="inline-flex rounded-full border border-white/18 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur hover:border-white/35 hover:text-white">Email us</a></div>} />
      <main className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
          <div className="rounded-[30px] border border-white/10 bg-white/[.025] p-5 shadow-2xl sm:p-8">
            <BookingForm />
          </div>
        </div>
      </main>
    </div>
  );
}
