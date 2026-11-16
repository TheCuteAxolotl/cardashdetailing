"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./CarWash3D.module.css";
import { createCarWashScene, type CarWashScene } from "@/lib/car-wash-scene";

const STEPS = ["Foam", "Rinse", "Shine"];

export default function CarWash3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CarWashScene | null>(null);
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const [phase, setPhase] = useState(0);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createCarWashScene(canvas, setPhase);
    sceneRef.current = scene;
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
    return () => { observer?.disconnect(); resizer?.disconnect(); scene.stop(); sceneRef.current = null; };
  }, []);

  // Drag sideways to spin the car; a plain tap pops a burst of bubbles.
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { x: event.clientX, moved: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setGrabbing(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const delta = event.clientX - drag.current.x;
    drag.current.x = event.clientX;
    drag.current.moved += Math.abs(delta);
    sceneRef.current?.rotateBy(delta * 0.012);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drag.current && drag.current.moved < 6) {
      const rect = event.currentTarget.getBoundingClientRect();
      sceneRef.current?.burst(event.clientX - rect.left, event.clientY - rect.top);
    }
    drag.current = null;
    setGrabbing(false);
  };
  const cancelDrag = () => { drag.current = null; setGrabbing(false); };

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={grabbing ? `${styles.canvas} ${styles.grabbing}` : styles.canvas}
        role="img"
        aria-label="Animation of a sports car turning on a platform while it is foamed, rinsed and polished to a shine"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
      />
      <div className={styles.steps} role="group" aria-label="Wash step">
        {STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className={index === phase ? `${styles.step} ${styles.stepActive}` : styles.step}
            aria-pressed={index === phase}
            onClick={() => { setPhase(index); sceneRef.current?.jumpTo(index); }}
          >
            {step}
          </button>
        ))}
      </div>
      <p className={styles.hint}>Drag the car to spin it. Tap it for bubbles.</p>
    </div>
  );
}
