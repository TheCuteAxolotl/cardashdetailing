import BookingForm from "@/components/BookingForm";
import PublicHero from "@/components/PublicHero";

const EMAIL = "cardashdetailing@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PublicHero imageCategory="contact-hero" eyebrowKey="contactEyebrow" titleKey="contactTitle" bodyKey="contactBody" action={<a href={`mailto:${EMAIL}`} className="inline-flex rounded-full border border-white/18 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur hover:border-white/35 hover:text-white">{EMAIL}</a>} />
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
