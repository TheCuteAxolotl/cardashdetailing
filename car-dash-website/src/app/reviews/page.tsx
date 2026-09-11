import PublicHero from "@/components/PublicHero";
import ReviewCards from "@/components/ReviewCards";

const REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PublicHero imageCategory="reviews-hero" eyebrowKey="reviewsEyebrow" titleKey="reviewsTitle" bodyKey="reviewsBody" action={<a href={REVIEW_URL} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black hover:bg-white/85">Leave a Google review</a>} />
      <main className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <ReviewCards />
      </main>
    </div>
  );
}
