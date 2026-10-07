"use client";

import { useEffect, useState } from "react";

type GoogleReview = {
  id: string;
  author: string;
  authorProfileUrl: string | null;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string | null;
  publishTime: string | null;
  googleMapsUri: string;
};

type GoogleReviewData = {
  businessName: string;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUri: string;
  reviewUrl: string;
  reviews: GoogleReview[];
  attributions?: Array<{ provider?: string; providerUri?: string }>;
};

const GOOGLE_REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

function Stars({ rating, dark = false }: { rating: number; dark?: boolean }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="tracking-[0.14em] text-[#7B5C4B]" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className={dark ? "text-white/15" : "text-black/12"}>{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export default function ReviewCards() {
  const [data, setData] = useState<GoogleReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/google-reviews", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Google reviews unavailable");
        return response.json();
      })
      .then((payload) => {
        setData(payload);
        setFailed(false);
      })
      .catch(() => {
        setData(null);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="review-card border border-black/[.08] bg-white p-8 text-black/42 shadow-[0_16px_50px_rgba(23,20,17,.04)]">
        Loading live Google reviews…
      </div>
    );
  }

  if (failed || !data) {
    return (
      <div className="review-card border border-black/[.08] bg-white p-8 shadow-[0_16px_50px_rgba(23,20,17,.04)]">
        <p className="text-xl font-semibold text-[#171411]">Google reviews are temporarily unavailable.</p>
        <p className="mt-3 text-black/48">Reviews can still be viewed or submitted directly on Google.</p>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-[#171411] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Open Google Reviews
        </a>
      </div>
    );
  }

  return (
    <section aria-label="Google reviews">
      <div className="review-summary mb-6 flex flex-col gap-6 border border-white/8 bg-[#171411] p-7 shadow-[0_22px_70px_rgba(23,20,17,.12)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Live from Google Maps</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {data.rating !== null && <span className="text-5xl font-semibold tracking-[-.05em] text-white">{data.rating.toFixed(1)}</span>}
            {data.rating !== null && <Stars rating={data.rating} dark />}
            {data.reviewCount !== null && (
              <span className="text-sm text-white/52">{data.reviewCount} Google reviews</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={data.googleMapsUri || GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/16 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View on Google Maps
          </a>
          <a
            href={data.reviewUrl || GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#171411] transition hover:bg-[#efe8e2]"
          >
            Leave a Google Review
          </a>
        </div>
      </div>

      <div className="review-grid grid gap-4 lg:grid-cols-2">
        {data.reviews.map((review) => (
          <article key={review.id} className="review-card group flex h-full flex-col border border-black/[.08] bg-white p-6 shadow-[0_14px_44px_rgba(23,20,17,.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(23,20,17,.075)] sm:p-7">
            <div className="flex items-center gap-4">
              {review.authorPhotoUrl ? (
                <img
                  src={review.authorPhotoUrl}
                  alt=""
                  className="h-11 w-11 rounded-full border border-black/8 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE8E2] text-base font-semibold text-[#7B5C4B]">
                  {review.author.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                {review.authorProfileUrl ? (
                  <a
                    href={review.authorProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#171411] hover:text-[#7B5C4B]"
                  >
                    {review.author}
                  </a>
                ) : (
                  <p className="font-semibold text-[#171411]">{review.author}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <Stars rating={review.rating} />
                  {review.relativeTime && <span className="text-black/32">{review.relativeTime}</span>}
                </div>
              </div>
            </div>

            {review.text && <p className="mt-6 flex-1 text-base leading-8 text-black/58"><span className="mr-1 text-2xl leading-none text-[#C0AB9A]">“</span>{review.text}<span className="ml-1 text-[#C0AB9A]">”</span></p>}

            <a
              href={review.googleMapsUri}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-fit text-sm font-semibold text-black/48 transition group-hover:text-black"
            >
              View this review on Google Maps →
            </a>
          </article>
        ))}
      </div>

      {!data.reviews.length && (
        <div className="review-card border border-black/[.08] bg-white p-8 text-black/48">
          No Google review cards were returned, but the business rating is live above.
        </div>
      )}

      <div className="mt-5 border-t border-black/[.07] px-1 pt-5 text-xs leading-6 text-black/32">
        <span translate="no" className="font-semibold text-black/55">Google Maps</span> reviews are shown in Google&apos;s relevance order. Reviewer names, profile links, photos, ratings and review links are provided by Google Maps.
      </div>
    </section>
  );
}
