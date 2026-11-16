"use client";

import { useEffect, useState } from "react";

export type GoogleReview = {
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

export type GoogleReviewData = {
  businessName: string;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUri: string;
  reviewUrl: string;
  reviews: GoogleReview[];
};

export const GOOGLE_REVIEW_URL = "https://g.page/r/CXj-njnM1fyvEAI/review";

// One shared request, so the hero rating and the review section do not each
// call Google separately.
let pending: Promise<GoogleReviewData | null> | null = null;

function loadReviews() {
  if (!pending) {
    pending = fetch("/api/google-reviews", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<GoogleReviewData>) : null))
      .catch(() => null);
  }
  return pending;
}

export function useGoogleReviews() {
  const [data, setData] = useState<GoogleReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    loadReviews().then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  return { data, loading };
}
