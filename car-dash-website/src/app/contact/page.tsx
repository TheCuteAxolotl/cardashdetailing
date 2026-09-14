import BookingForm from "@/components/BookingForm";
import { BUSINESS_PHONE, BUSINESS_PHONE_DISPLAY } from "@/lib/constants";
import { getSiteContent } from "@/lib/site-content";

export default async function ContactPage() {
  const content = await getSiteContent();

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Book a detail</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.055em] sm:text-6xl">Choose the service, day, and time.</h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-7 text-white/50">No account needed. Pick a fixed-price service, choose an open appointment, and see the total before you submit.</p>
            <div className="mt-5 flex flex-wrap gap-3"><a href="/#prices" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">See all prices</a><a href={`tel:${BUSINESS_PHONE}`} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#111]">Call {BUSINESS_PHONE_DISPLAY}</a><a href="/quote" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-bold">Exact quote</a></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-[28px] border border-white/10 bg-[#151515] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-7">
          <BookingForm initialSiteContent={content} />
        </div>
      </section>
    </main>
  );
}
