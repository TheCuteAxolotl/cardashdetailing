"use client";

import { useEffect, useState } from "react";

type Review = { id: string; name: string; rating: number; comment: string };

export default function ReviewCards() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews?approved=true", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-neutral-500">Loading reviews…</p>;
  if (!reviews.length) return <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-neutral-400">Customer reviews will appear here as they are added.</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-[2rem] border border-white/10 bg-[#111111] p-7">
          <div className="text-lg tracking-[0.16em] text-red-500">{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</div>
          <p className="mt-5 text-base leading-8 text-neutral-300">“{review.comment}”</p>
          <p className="mt-6 font-black text-white">{review.name}</p>
        </article>
      ))}
    </div>
  );
}
