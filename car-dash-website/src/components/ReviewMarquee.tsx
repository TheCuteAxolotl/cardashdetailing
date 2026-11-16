"use client";

import styles from "./ReviewMarquee.module.css";
import { GOOGLE_REVIEW_URL, useGoogleReviews, type GoogleReview } from "@/lib/use-google-reviews";

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}<span className={styles.starsEmpty}>{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function Card({ review }: { review: GoogleReview }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        {review.authorPhotoUrl ? (
          <img src={review.authorPhotoUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <div className={styles.avatarFallback}>{review.author.slice(0, 1).toUpperCase()}</div>
        )}
        <div className={styles.cardWho}>
          <p className={styles.author}>{review.author}</p>
          <p className={styles.when}><Stars rating={review.rating} />{review.relativeTime && <span>{review.relativeTime}</span>}</p>
        </div>
      </div>
      {review.text && <p className={styles.text}>“{review.text}”</p>}
      <a href={review.googleMapsUri} target="_blank" rel="noreferrer" className={styles.cardLink}>Read on Google Maps</a>
    </article>
  );
}

export default function ReviewMarquee() {
  const { data, loading } = useGoogleReviews();

  if (loading) return <div className={styles.notice}>Loading live Google reviews…</div>;
  if (!data) {
    return (
      <div className={styles.notice}>
        <p>Google reviews are temporarily unavailable.</p>
        <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className={styles.primary}>Open Google Reviews</a>
      </div>
    );
  }

  const reviews = data.reviews.filter((review) => review.text);
  // Repeat short lists so the moving row always fills the screen.
  const repeats = reviews.length ? Math.max(1, Math.ceil(6 / reviews.length)) : 0;
  const row = Array.from({ length: repeats }, () => reviews).flat();

  return (
    <div>
      <div className={styles.summary}>
        <div className={styles.score}>
          {data.rating !== null && <span className={styles.rating}>{data.rating.toFixed(1)}</span>}
          <div>
            {data.rating !== null && <Stars rating={data.rating} />}
            <p className={styles.count}>{data.reviewCount !== null ? `${data.reviewCount} Google reviews` : "Live from Google Maps"}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <a href="/reviews" className={styles.secondary}>All reviews</a>
          <a href={data.reviewUrl || GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className={styles.primary}>Leave a review</a>
        </div>
      </div>

      {row.length > 0 && (
        <div className={styles.viewport}>
          <div className={styles.track} style={{ animationDuration: `${row.length * 9}s` }}>
            {row.map((review, index) => <Card key={`a-${index}`} review={review} />)}
            <div className={styles.copy} aria-hidden="true">
              {row.map((review, index) => <Card key={`b-${index}`} review={review} />)}
            </div>
          </div>
        </div>
      )}

      <p className={styles.attribution}>
        <span translate="no">Google Maps</span> reviews, shown in Google’s relevance order. Reviewer names, photos, ratings and links are provided by Google Maps.
      </p>
    </div>
  );
}
