"use client";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./HomeExperience.module.css";

const WORDMARK = "CAR DASH";

export default function BrandIntro() {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    // The entrance and curtain exit run in CSS so they start before hydration;
    // this only removes the overlay once the curtain has lifted.
    const remove = window.setTimeout(() => {
      (window as Window & { __carDashIntroDone?: boolean }).__carDashIntroDone = true;
      setFinished(true);
    }, 1900);
    return () => clearTimeout(remove);
  }, []);
  if (finished) return null;
  return (
    <div className={styles.brandIntro} aria-hidden="true">
      <span className={styles.introMark}>
        {WORDMARK.split("").map((char, index) => (
          <span key={index} className={styles.introLetter}>
            <span style={{ "--i": index } as CSSProperties}>{char === " " ? " " : char}</span>
          </span>
        ))}
      </span>
      <i className={styles.introRule} />
      <small>MOBILE DETAILING · SOUTH ELGIN</small>
    </div>
  );
}
