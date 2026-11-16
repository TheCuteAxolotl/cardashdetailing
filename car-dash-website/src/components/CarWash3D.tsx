"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CarWash3D.module.css";
import { createCarWashScene } from "@/lib/car-wash-scene";

const STEPS = ["Foam", "Rinse", "Shine"];

export default function CarWash3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createCarWashScene(canvas, setPhase);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;

    const refresh = () => {
      scene.resize();
      if (reduced || !visible) scene.drawStill();
    };
    refresh();

    // Only animate while the canvas is on screen, to save battery.
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (reduced) return;
      if (visible) scene.start(); else scene.stop();
    }, { threshold: 0.15 });
    observer?.observe(canvas);
    if (!observer && !reduced) scene.start();

    const resizer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    resizer?.observe(canvas);
    return () => { observer?.disconnect(); resizer?.disconnect(); scene.stop(); };
  }, []);

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label="Animation of a sports car turning on a platform while it is foamed, rinsed and polished to a shine" />
      <ol className={styles.steps} aria-hidden="true">
        {STEPS.map((step, index) => (
          <li key={step} className={index === phase ? styles.stepActive : undefined}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
