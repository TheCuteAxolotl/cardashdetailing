import ReviewCards from "@/components/ReviewCards";

const GOOGLE_REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.18),transparent_36%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-18">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Customer Reviews</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Real work. Real customer feedback.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            See what customers have to say about Car Dash Detailing, or share your experience directly on Google.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-black transition hover:bg-red-500"
            >
              Leave a Google Review
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black transition hover:bg-white/10"
            >
              Book Your Detail
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="mb-8 rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-600/10 to-transparent p-7">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">Google Reviews</p>
          <h2 className="mt-3 text-2xl font-black">Had a great experience with Car Dash?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
            Google reviews help local customers find Car Dash Detailing and know what to expect before booking.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-neutral-200"
          >
            Review Car Dash on Google
          </a>
        </div>

        <ReviewCards />
      </main>
    </div>
  );
}
