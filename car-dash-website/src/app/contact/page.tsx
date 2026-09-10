import BookingForm from "../../components/BookingForm";
import SitePhoto from "@/components/SitePhoto";

const WORK_EMAIL = "cardashdetailing@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <section className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:px-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">Contact</p>
          <h1 className="mt-5 text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Ready to get the vehicle taken care of?</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/45">Book online or email Car Dash Detailing for availability, pricing, and help choosing the right service.</p>
          <a href={`mailto:${WORK_EMAIL}`} className="mt-7 inline-flex text-sm font-semibold text-red-400 hover:text-red-300">{WORK_EMAIL} →</a>
        </div>
        <div className="overflow-hidden rounded-[1.8rem]">
          <SitePhoto category="contact-hero" className="h-[340px] w-full object-cover sm:h-[480px]" />
        </div>
      </section>

      <main id="booking" className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-18">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8"><BookingForm /></div>
        </div>
      </main>
    </div>
  );
}
