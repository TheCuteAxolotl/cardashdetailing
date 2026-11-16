"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./BeforeAfterSlider.module.css";
import { BEFORE_AFTER_PAIRS, type BeforeAfterPair, type CropBox } from "@/lib/before-after";

// Positions the full collage photo so only the crop box fills the frame.
function cropStyle([left, top, right, bottom]: CropBox): CSSProperties {
  const width = right - left;
  const height = bottom - top;
  return {
    width: `${100 / width}%`,
    height: `${100 / height}%`,
    left: `${(-left / width) * 100}%`,
    top: `${(-top / height) * 100}%`,
  };
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

function CompareCard({ pair, hint, onFail }: { pair: BeforeAfterPair; hint: boolean; onFail: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const position = useRef(50);
  const pending = useRef<number | null>(null);
  const frameId = useRef(0);
  const dragging = useRef(false);
  const touched = useRef(false);

  // The handle position is written straight to a CSS variable (once per
  // animation frame) instead of React state, so dragging never re-renders.
  const apply = (value: number, glide = false) => {
    const frame = frameRef.current;
    if (!frame) return;
    position.current = clamp(value);
    frame.classList.toggle(styles.glide, glide);
    frame.style.setProperty("--pos", `${position.current}%`);
    frame.setAttribute("aria-valuenow", String(Math.round(position.current)));
  };

  const queue = (clientX: number) => {
    pending.current = clientX;
    if (frameId.current) return;
    frameId.current = requestAnimationFrame(() => {
      frameId.current = 0;
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || pending.current === null) return;
      apply(((pending.current - rect.left) / rect.width) * 100);
    });
  };

  useEffect(() => () => cancelAnimationFrame(frameId.current), []);

  // One gentle nudge on the first card so it is clear the handle can be dragged.
  useEffect(() => {
    const frame = frameRef.current;
    if (!hint || !frame || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      [[500, 70], [1300, 32], [2100, 50]].forEach(([delay, value]) => {
        timers.push(window.setTimeout(() => { if (!touched.current) apply(value, true); }, delay));
      });
    }, { threshold: 0.7 });
    observer.observe(frame);
    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, [hint]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    touched.current = true;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add(styles.dragging);
    // Glide to where the finger landed, then follow it directly.
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width > 0) apply(((event.clientX - rect.left) / rect.width) * 100, true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    frameRef.current?.classList.remove(styles.glide);
    queue(event.clientX);
  };
  const endDrag = () => {
    dragging.current = false;
    frameRef.current?.classList.remove(styles.dragging);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 4;
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = position.current - step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = position.current + step;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    touched.current = true;
    apply(next, true);
  };

  const src = `/api/images/${pair.imageId}/file`;

  return (
    <figure className={styles.card}>
      <div
        ref={frameRef}
        className={styles.frame}
        role="slider"
        tabIndex={0}
        aria-label={`Before and after: ${pair.caption}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
      >
        <div className={styles.pane}>
          <img src={src} alt={`After: ${pair.caption}`} style={cropStyle(pair.after)} draggable={false} loading="lazy" decoding="async" onError={onFail} />
        </div>
        <div className={styles.beforeClip}>
          <div className={styles.beforeInner}>
            <img src={src} alt={`Before: ${pair.caption}`} style={cropStyle(pair.before)} draggable={false} loading="lazy" decoding="async" />
          </div>
        </div>
        <span className={`${styles.tag} ${styles.tagBefore}`} aria-hidden="true">Before</span>
        <span className={`${styles.tag} ${styles.tagAfter}`} aria-hidden="true">After</span>
        <div className={styles.divider} aria-hidden="true">
          <span className={styles.handle}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
      <figcaption className={styles.caption}><strong>{pair.label}</strong><span>{pair.caption}</span></figcaption>
    </figure>
  );
}

export default function BeforeAfterSlider() {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const pairs = BEFORE_AFTER_PAIRS.filter((pair) => !failed[pair.imageId]);
  if (pairs.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="before-after-heading">
      <div className={styles.inner}>
        <div className={styles.header} data-reveal>
          <div>
            <p className={styles.eyebrow}>Before &amp; after</p>
            <h2 id="before-after-heading" className={styles.heading}>Slide to see <span>the difference.</span></h2>
          </div>
          <div className={styles.headerSide}>
            <p className={styles.body}>Real vehicles we’ve detailed. Drag any handle to compare.</p>
            <a href="/gallery" className={styles.link}>View full gallery <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className={styles.grid} data-stagger>
          {pairs.map((pair, index) => (
            <CompareCard
              key={pair.key}
              pair={pair}
              hint={index === 0}
              onFail={() => setFailed((current) => ({ ...current, [pair.imageId]: true }))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
