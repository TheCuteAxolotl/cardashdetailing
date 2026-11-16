"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./BeforeAfterSlider.module.css";
import { BEFORE_AFTER_PAIRS, type CropBox } from "@/lib/before-after";

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

export default function BeforeAfterSlider() {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [gliding, setGliding] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const frameRef = useRef<HTMLDivElement>(null);
  const hinted = useRef(false);
  const touched = useRef(false);

  const pairs = BEFORE_AFTER_PAIRS.filter((pair) => !failed[pair.imageId]);
  const pair = pairs[Math.min(index, Math.max(pairs.length - 1, 0))];

  // A one-time nudge when the slider first scrolls into view, so it is clear
  // the handle can be dragged. Skipped when reduced motion is requested.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || hinted.current || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || hinted.current) return;
      hinted.current = true;
      observer.disconnect();
      const step = (delay: number, value: number, last = false) => timers.push(window.setTimeout(() => {
        if (touched.current) return;
        setGliding(!last);
        if (!last) setPosition(value);
      }, delay));
      step(500, 72);
      step(1250, 30);
      step(2000, 50);
      step(2750, 50, true);
    }, { threshold: 0.6 });
    observer.observe(frame);
    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, [pair?.key]);

  const moveTo = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    touched.current = true;
    setGliding(false);
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => { if (dragging) moveTo(event.clientX); };
  const endDrag = () => setDragging(false);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 4;
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = position - step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = position + step;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    touched.current = true;
    setGliding(false);
    setPosition(clamp(next));
  };

  const choose = (next: number) => {
    touched.current = true;
    setGliding(true);
    setIndex((next + pairs.length) % pairs.length);
    setPosition(50);
    window.setTimeout(() => setGliding(false), 500);
  };

  if (!pair) return null;
  const src = `/api/images/${pair.imageId}/file`;
  const markFailed = () => setFailed((current) => ({ ...current, [pair.imageId]: true }));

  return (
    <section className={styles.section} aria-labelledby="before-after-heading">
      <div className={styles.inner}>
        <div className={styles.copy} data-reveal>
          <p className={styles.eyebrow}>Before &amp; after</p>
          <h2 id="before-after-heading" className={styles.heading}>Slide to see <span>the difference.</span></h2>
          <p className={styles.body}>Real vehicles we’ve detailed. Drag the handle left and right to compare how each one arrived with how it left.</p>
          <div className={styles.tabs} role="group" aria-label="Choose a before and after">
            {pairs.map((item, itemIndex) => (
              <button
                key={item.key}
                type="button"
                className={item.key === pair.key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                aria-pressed={item.key === pair.key}
                onClick={() => choose(itemIndex)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <a href="/gallery" className={styles.link}>View full gallery <span aria-hidden="true">→</span></a>
        </div>

        <div className={styles.stage} data-reveal>
          <div
            ref={frameRef}
            className={[styles.frame, dragging && styles.frameDragging, gliding && styles.frameGliding].filter(Boolean).join(" ")}
            style={{ "--pos": `${position}%` } as CSSProperties}
            role="slider"
            tabIndex={0}
            aria-label={`Before and after comparison: ${pair.caption}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% before, ${100 - Math.round(position)}% after`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown}
          >
            <div className={styles.pane} key={`${pair.key}-after`}>
              <img src={src} alt={`After: ${pair.caption}`} style={cropStyle(pair.after)} draggable={false} loading="lazy" decoding="async" onError={markFailed} />
            </div>
            <div className={`${styles.pane} ${styles.paneBefore}`} key={`${pair.key}-before`}>
              <img src={src} alt={`Before: ${pair.caption}`} style={cropStyle(pair.before)} draggable={false} loading="lazy" decoding="async" />
            </div>
            <span className={`${styles.tag} ${styles.tagBefore}`} aria-hidden="true">Before</span>
            <span className={`${styles.tag} ${styles.tagAfter}`} aria-hidden="true">After</span>
            <div className={styles.divider} aria-hidden="true">
              <span className={styles.handle}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
          <div className={styles.meta}>
            <p className={styles.caption}>{pair.caption}</p>
            {pairs.length > 1 && (
              <div className={styles.nav}>
                <button type="button" onClick={() => choose(pairs.indexOf(pair) - 1)} aria-label="Previous before and after">←</button>
                <span>{pairs.indexOf(pair) + 1} / {pairs.length}</span>
                <button type="button" onClick={() => choose(pairs.indexOf(pair) + 1)} aria-label="Next before and after">→</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
