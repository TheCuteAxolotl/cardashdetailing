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

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="tracking-[0.14em] text-[#FF2D2D]" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-white/15">{"★".repeat(5 - rounded)}</span>
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
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-neutral-400">
        Loading live Google reviews…
      </div>
    );
  }

  if (failed || !data) {
    return (
      <div className="rounded-[2rem] border border-[#FF2D2D]/20 bg-[#111318] p-8">
        <p className="text-xl font-black text-white">Google reviews are temporarily unavailable.</p>
        <p className="mt-3 text-neutral-400">Reviews can still be viewed or submitted directly on Google.</p>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-[#FF2D2D] px-5 py-2.5 text-sm font-black text-[#0D0D0D] transition hover:bg-[#FF2D2D]"
        >
          Open Google Reviews
        </a>
      </div>
    );
  }

  return (
    <section aria-label="Google reviews">
      <div className="mb-7 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-[#111318] p-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#FF2D2D]">Live from Google Maps</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {data.rating !== null && <span className="text-4xl font-black text-white">{data.rating.toFixed(1)}</span>}
            {data.rating !== null && <Stars rating={data.rating} />}
            {data.reviewCount !== null && (
              <span className="text-sm text-neutral-400">{data.reviewCount} Google reviews</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={data.googleMapsUri || GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/10"
          >
            View on Google Maps
          </a>
          <a
            href={data.reviewUrl || GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-[#FF2D2D] px-5 py-2.5 text-sm font-black text-[#0D0D0D] transition hover:bg-[#FF2D2D]"
          >
            Leave a Google Review
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.reviews.map((review) => (
          <article key={review.id} className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-[#111318] p-7">
            <div className="flex items-center gap-4">
              {review.authorPhotoUrl ? (
                <img
                  src={review.authorPhotoUrl}
                  alt=""
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF2D2D]/12 text-lg font-black text-[#FF2D2D]">
                  {review.author.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                {review.authorProfileUrl ? (
                  <a
                    href={review.authorProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-black text-white hover:text-[#FF2D2D]"
                  >
                    {review.author}
                  </a>
                ) : (
                  <p className="font-black text-white">{review.author}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <Stars rating={review.rating} />
                  {review.relativeTime && <span className="text-neutral-500">{review.relativeTime}</span>}
                </div>
              </div>
            </div>

            {review.text && <p className="mt-6 flex-1 text-base leading-8 text-neutral-300">“{review.text}”</p>}

            <a
              href={review.googleMapsUri}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-fit text-sm font-black text-[#FF2D2D] transition hover:text-[#FF2D2D]"
            >
              View this review on Google Maps →
            </a>
          </article>
        ))}
      </div>

      {!data.reviews.length && (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-neutral-400">
          No Google review cards were returned, but the business rating is live above.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-xs leading-6 text-neutral-500">
        <span translate="no" className="font-bold text-neutral-300">Google Maps</span> reviews are shown in Google&apos;s relevance order. Reviewer names, profile links, photos, ratings and review links are provided by Google Maps.
      </div>
    </section>
  );
}
