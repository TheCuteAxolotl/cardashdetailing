"use client";
import { useEffect, useState } from "react";
import styles from "./HomeExperience.module.css";

export default function BrandIntro() {
  const [leaving, setLeaving] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), 850);
    const remove = window.setTimeout(() => setFinished(true), 1650);
    return () => { clearTimeout(fade); clearTimeout(remove); };
  }, []);
  if (finished) return null;
  return <div className={styles.brandIntro} style={{ opacity: leaving ? 0 : 1 }} aria-hidden="true"><span>CAR DASH</span><small>MOBILE DETAILING · SOUTH ELGIN</small></div>;
}
