import ReviewCards from "@/components/ReviewCards";
import SitePhoto from "@/components/SitePhoto";

const GOOGLE_REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <section className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-end lg:px-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">Google Reviews</p>
          <h1 className="mt-5 text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Feedback from customers who booked Car Dash.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/45">Live Google rating and customer reviews are shown below.</p>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-semibold hover:bg-red-500">Leave a Google Review</a>
        </div>
        <div className="overflow-hidden rounded-[1.8rem]">
          <SitePhoto category="reviews-hero" className="h-[340px] w-full object-cover sm:h-[480px]" />
        </div>
      </section>

      <main className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1480px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12"><ReviewCards /></div>
      </main>
    </div>
  );
}
