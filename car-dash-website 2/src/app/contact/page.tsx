import BookingForm from "../../components/BookingForm";

const WORK_EMAIL = "cardashdetailing@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.18),transparent_36%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-18">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Contact Car Dash</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Ready to get your vehicle taken care of?</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            Book online or reach out by email for availability, pricing, and help choosing the right service for your vehicle.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${WORK_EMAIL}`}
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-black transition hover:bg-red-500"
            >
              Email Car Dash
            </a>
            <a
              href="#booking"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black transition hover:bg-white/10"
            >
              Book Online
            </a>
          </div>

          <p className="mt-5 text-sm text-neutral-400">
            <span className="font-bold text-white">Email:</span>{" "}
            <a className="text-red-400 hover:text-red-300" href={`mailto:${WORK_EMAIL}`}>
              {WORK_EMAIL}
            </a>
          </p>
        </div>
      </section>

      <main id="booking" className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <BookingForm />
        </div>
      </main>
    </div>
  );
}
