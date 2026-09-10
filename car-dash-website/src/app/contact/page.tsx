import BookingForm from "../../components/BookingForm";
import SitePhoto from "@/components/SitePhoto";

const WORK_EMAIL = "cardashdetailing@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:px-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">Book / Contact</p>
          <h1 className="mt-5 text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Send the car info. The rest can be figured out from there.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/40">Use the form for a booking request, or email Car Dash if there is a quick question first.</p>
          <a href={`mailto:${WORK_EMAIL}`} className="mt-7 inline-flex text-sm font-semibold text-red-400 hover:text-red-300">{WORK_EMAIL} →</a>
        </div>
        <div className="overflow-hidden rounded-[1.8rem]"><SitePhoto category="contact-hero" className="h-[340px] w-full object-cover sm:h-[480px]" /></div>
      </section>

      <main id="booking" className="border-t border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[.55fr_1.45fr] lg:px-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/28">Booking request</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em]">A few details is enough to start.</h2>
            <p className="mt-4 text-sm leading-7 text-white/35">Submitting the form sends a request, not a locked appointment. Timing and anything unusual about the vehicle can be confirmed after.</p>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-[#0d0d0d] p-5 sm:p-8"><BookingForm /></div>
        </div>
      </main>
    </div>
  );
}
