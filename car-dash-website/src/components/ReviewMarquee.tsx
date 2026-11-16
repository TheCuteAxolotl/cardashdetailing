"use client";

import { useEffect, useRef } from "react";
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);
  const hovering = useRef(false);
  const reviewCount = data?.reviews.length ?? 0;

  // The row drifts on its own, but it is a real scrolling strip: visitors can
  // swipe or use the arrows, and it starts drifting again once they stop.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !reviewCount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last = 0;
    let visible = false;
    let position = viewport.scrollLeft;
    let drifting = false;

    const hold = (ms: number) => { holdUntil.current = Math.max(holdUntil.current, performance.now() + ms); };
    const onTouch = () => hold(2600);
    const onScroll = () => { if (!drifting) hold(1800); };
    const onEnter = () => { hovering.current = true; };
    const onLeave = () => { hovering.current = false; hold(600); };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const elapsed = Math.min(64, now - (last || now));
      last = now;
      const half = viewport.scrollWidth / 2;
      if (!visible || hovering.current || now < holdUntil.current || half <= viewport.clientWidth / 2) {
        position = viewport.scrollLeft;
        return;
      }
      position += elapsed * 0.045;
      if (position >= half) position -= half;
      drifting = true;
      viewport.scrollLeft = position;
      requestAnimationFrame(() => { drifting = false; });
    };

    const observer = new IntersectionObserver((entries) => { visible = entries.some((entry) => entry.isIntersecting); });
    observer.observe(viewport);
    viewport.addEventListener("touchstart", onTouch, { passive: true });
    viewport.addEventListener("touchmove", onTouch, { passive: true });
    viewport.addEventListener("wheel", onTouch, { passive: true });
    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("mouseenter", onEnter);
    viewport.addEventListener("mouseleave", onLeave);
    viewport.addEventListener("focusin", onEnter);
    viewport.addEventListener("focusout", onLeave);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport.removeEventListener("touchstart", onTouch);
      viewport.removeEventListener("touchmove", onTouch);
      viewport.removeEventListener("wheel", onTouch);
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("mouseenter", onEnter);
      viewport.removeEventListener("mouseleave", onLeave);
      viewport.removeEventListener("focusin", onEnter);
      viewport.removeEventListener("focusout", onLeave);
    };
  }, [reviewCount]);

  const step = (direction: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    holdUntil.current = performance.now() + 4000;
    const card = viewport.querySelector("article");
    const distance = (card ? card.getBoundingClientRect().width : 320) + 18;
    const half = viewport.scrollWidth / 2;
    // Stay inside the repeated strip so there is always room to move.
    if (direction < 0 && viewport.scrollLeft < distance) viewport.scrollLeft += half;
    if (direction > 0 && viewport.scrollLeft > half) viewport.scrollLeft -= half;
    viewport.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

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
          {row.length > 1 && (
            <div className={styles.arrows}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous review">←</button>
              <button type="button" onClick={() => step(1)} aria-label="Next review">→</button>
            </div>
          )}
          <a href="/reviews" className={styles.secondary}>All reviews</a>
          <a href={data.reviewUrl || GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className={styles.primary}>Leave a review</a>
        </div>
      </div>

      {row.length > 0 && (
        <div className={styles.viewport} ref={viewportRef}>
          <div className={styles.track}>
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
