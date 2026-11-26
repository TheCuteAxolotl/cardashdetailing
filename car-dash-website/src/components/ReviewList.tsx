"use client";

import { useState } from "react";
import styles from "./ReviewList.module.css";
import { GOOGLE_REVIEW_URL, useGoogleReviews, type GoogleReview } from "@/lib/use-google-reviews";

function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={index < full ? styles.on : styles.off}>
          <path d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z" />
        </svg>
      ))}
    </span>
  );
}

// A laurel branch: leaves set along a curved stem; mirrored for the right side.
const LAUREL_LEAVES = (() => {
  const point = (t: number) => ({
    x: (1 - t) ** 2 * 44 + 2 * (1 - t) * t * 6 + t ** 2 * 30,
    y: (1 - t) ** 2 * 114 + 2 * (1 - t) * t * 72 + t ** 2 * 8,
  });
  const leaves: { x: number; y: number; angle: number; scale: number }[] = [];
  for (let index = 0; index < 7; index += 1) {
    const t = 0.1 + index * 0.13;
    const a = point(t);
    const b = point(t + 0.01);
    const tangent = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const scale = 1 - index * 0.06;
    leaves.push({ ...a, angle: tangent - 38, scale });
    leaves.push({ ...a, angle: tangent + 38, scale: scale * 0.9 });
  }
  return leaves;
})();

function Laurel({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 120" className={styles.laurel} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path d="M44 114Q6 72 30 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {LAUREL_LEAVES.map((leaf, index) => (
        <ellipse key={index} cx="0" cy="0" rx={10 * leaf.scale} ry={4.2 * leaf.scale}
          transform={`translate(${leaf.x.toFixed(2)} ${leaf.y.toFixed(2)}) rotate(${leaf.angle.toFixed(1)}) translate(${(9 * leaf.scale).toFixed(2)} 0)`}
          fill="currentColor" />
      ))}
    </svg>
  );
}

function Review({ review }: { review: GoogleReview }) {
  const [open, setOpen] = useState(false);
  const long = review.text.length > 320;
  return (
    <article className={styles.review}>
      <h3 className={styles.author}>
        {review.authorProfileUrl ? <a href={review.authorProfileUrl} target="_blank" rel="noreferrer">{review.author}</a> : review.author}
      </h3>
      <p className={styles.meta}>
        <Stars rating={review.rating} size={16} />
        {review.relativeTime && <><span aria-hidden="true">·</span><span>{review.relativeTime}</span></>}
        <span aria-hidden="true">·</span>
        <a href={review.googleMapsUri} target="_blank" rel="noreferrer" className={styles.source}>from Google</a>
      </p>
      <p className={styles.text} data-clamped={long && !open ? "" : undefined}>{review.text}</p>
      {long && <button type="button" className={styles.more} onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Show less" : "Read more"}</button>}
    </article>
  );
}

export default function ReviewList() {
  const { data, loading } = useGoogleReviews();

  if (loading) return <div className={styles.notice}>Loading Google reviews…</div>;
  if (!data) {
    return (
      <div className={styles.notice}>
        <p>Google reviews are temporarily unavailable.</p>
        <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className={styles.write}>Open Google Reviews</a>
      </div>
    );
  }

  const reviews = data.reviews.filter((review) => review.text);
  const total = data.reviewCount ?? 0;
  // Google doesn't share the star breakdown. A 5.0 average means every review is
  // five stars, so the bars are shown only then; otherwise they'd be a guess.
  const allFive = data.rating === 5 && total > 0;
  const writeUrl = data.reviewUrl || GOOGLE_REVIEW_URL;

  return (
    <div className={styles.wrap}>
      <aside className={styles.side}>
        <div className={styles.summary}>
          <div className={styles.score}>
            <Laurel />
            <div className={styles.scoreText}>
              {data.rating !== null && <p className={styles.rating}>{data.rating.toFixed(1)}</p>}
              {data.rating !== null && <Stars rating={data.rating} size={20} />}
              <p className={styles.count}>{total ? `${total} reviews` : "Google reviews"}</p>
            </div>
            <Laurel flip />
          </div>
          <a href={writeUrl} target="_blank" rel="noreferrer" className={styles.write}>Write a review</a>
        </div>

        {allFive && (
          <ul className={styles.bars} aria-label="Rating breakdown">
            {[5, 4, 3, 2, 1].map((stars) => {
              const value = stars === 5 ? total : 0;
              return (
                <li key={stars} aria-label={`${stars} stars: ${value}`}>
                  <Stars rating={stars} size={15} />
                  <span className={styles.track}><span style={{ width: `${(value / total) * 100}%` }} /></span>
                  <span className={styles.barCount}>{value}</span>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div className={styles.list}>
        {reviews.map((review) => <Review key={review.id} review={review} />)}
        <div className={styles.footer}>
          <a href={data.googleMapsUri} target="_blank" rel="noreferrer" className={styles.all}>See all {total || ""} reviews on Google <span aria-hidden="true">→</span></a>
          <p className={styles.attribution}>Reviews shown in Google’s relevance order. Names, ratings and links are provided by <span translate="no">Google Maps</span>.</p>
        </div>
      </div>
    </div>
  );
}
