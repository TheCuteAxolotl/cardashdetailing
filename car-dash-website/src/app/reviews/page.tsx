import PublicHero from "@/components/PublicHero";
import ReviewCards from "@/components/ReviewCards";
import PageMediaBand from "@/components/PageMediaBand";

const REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <PublicHero imageCategory="reviews-hero" eyebrowKey="reviewsEyebrow" titleKey="reviewsTitle" bodyKey="reviewsBody" action={<div className="flex flex-wrap gap-3"><a href="/#book" className="inline-flex rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-white">Book now</a><a href={REVIEW_URL} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold">Leave a Google review</a></div>} />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <ReviewCards />
        <PageMediaBand categories={["reviews-media"]} theme="light" eyebrow="Customer cars" title="A little more of the work behind the reviews." className="mt-12" />
      </main>
    </div>
  );
}
