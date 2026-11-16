"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./CarWash3D.module.css";
import { createCarWashScene, type CarWashScene, type WashProgress } from "@/lib/car-wash-scene";

const STEPS = ["Foam", "Rinse", "Shine"];
const TOOL_HELP = [
  "Rub the foam over the whole car. It keeps turning so you can reach every side.",
  "Now rinse the foam off.",
  "Last step: buff the paint until it sparkles.",
];
const EMPTY: WashProgress = { foam: 0, rinse: 0, shine: 0, done: false };

export default function CarWash3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CarWashScene | null>(null);
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const playingRef = useRef(false);
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);
  const [phase, setPhase] = useState(0);
  const [grabbing, setGrabbing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tool, setTool] = useState(0);
  const [progress, setProgress] = useState<WashProgress>(EMPTY);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createCarWashScene(canvas, setPhase, setProgress);
    sceneRef.current = scene;
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scene.setMotion(!reducedRef.current);

    const refresh = () => {
      scene.resize();
      if ((reducedRef.current && !playingRef.current) || !visibleRef.current) scene.drawStill();
    };
    refresh();

    // Only animate while the canvas is on screen, to save battery.
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      visibleRef.current = entries.some((entry) => entry.isIntersecting);
      if (reducedRef.current && !playingRef.current) return;
      if (visibleRef.current) scene.start(); else scene.stop();
    }, { threshold: 0.15 });
    observer?.observe(canvas);
    if (!observer && !reducedRef.current) scene.start();

    const resizer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    resizer?.observe(canvas);
    return () => { observer?.disconnect(); resizer?.disconnect(); scene.stop(); sceneRef.current = null; };
  }, []);

  // Move on to the next tool when a step is finished.
  const activeTool = !playing ? tool : progress.foam < 1 ? Math.min(tool, 0) : progress.rinse < 1 ? Math.min(tool, 1) : tool;
  useEffect(() => {
    if (!playing || progress.done) return;
    const next = progress.foam < 1 ? 0 : progress.rinse < 1 ? 1 : 2;
    setTool(next);
    sceneRef.current?.setTool(next);
  }, [playing, progress.foam < 1, progress.rinse < 1, progress.done]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPlaying = () => {
    playingRef.current = true;
    setPlaying(true);
    setTool(0);
    setProgress(EMPTY);
    sceneRef.current?.setTool(0);
    sceneRef.current?.setMode("play");
    sceneRef.current?.start();
  };
  const stopPlaying = () => {
    playingRef.current = false;
    setPlaying(false);
    setProgress(EMPTY);
    sceneRef.current?.setMode("auto");
    if (reducedRef.current) { sceneRef.current?.stop(); sceneRef.current?.drawStill(); }
  };
  const chooseTool = (index: number) => {
    if (!playing) { setPhase(index); sceneRef.current?.jumpTo(index); return; }
    // A step unlocks once the one before it is done.
    if ((index >= 1 && progress.foam < 1) || (index === 2 && progress.rinse < 1)) return;
    setTool(index);
    sceneRef.current?.setTool(index);
  };

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (playing) {
      const { x, y } = point(event);
      sceneRef.current?.setPointer(x, y, true, true);
      return;
    }
    drag.current = { x: event.clientX, moved: 0 };
    setGrabbing(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (playing) {
      const { x, y } = point(event);
      sceneRef.current?.setPointer(x, y, event.buttons > 0 || (event.pointerType !== "mouse" && event.pressure > 0), true);
      return;
    }
    if (!drag.current) return;
    const delta = event.clientX - drag.current.x;
    drag.current.x = event.clientX;
    drag.current.moved += Math.abs(delta);
    sceneRef.current?.rotateBy(delta * 0.012);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = point(event);
    if (playing) { sceneRef.current?.setPointer(x, y, false, event.pointerType === "mouse"); return; }
    if (drag.current && drag.current.moved < 6) sceneRef.current?.burst(x, y);
    drag.current = null;
    setGrabbing(false);
  };
  const cancelPointer = () => {
    if (playing) sceneRef.current?.setPointer(-999, -999, false, false);
    drag.current = null;
    setGrabbing(false);
  };

  const values = [progress.foam, progress.rinse, progress.shine];
  const canvasClass = [styles.canvas, grabbing && styles.grabbing, playing && styles.playing].filter(Boolean).join(" ");

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={canvasClass}
          role="img"
          aria-label={playing ? "A dirty sports car on a turning platform. Rub it with the selected tool to wash it." : "Animation of a sports car turning on a platform while it is foamed, rinsed and polished to a shine"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={cancelPointer}
          onPointerLeave={() => { if (playing) sceneRef.current?.setPointer(-999, -999, false, false); }}
        />
        {playing && progress.done && (
          <div className={styles.done} role="status">
            <p className={styles.doneTitle}>Spotless.</p>
            <p className={styles.doneText}>Nice work. Want us to do the real one?</p>
            <div className={styles.doneActions}>
              <a href="#choose-detail" className={styles.cta}>Choose a detail</a>
              <button type="button" className={styles.ghost} onClick={startPlaying}>Wash again</button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.steps} role="group" aria-label={playing ? "Washing tools" : "Wash step"}>
        {STEPS.map((step, index) => {
          const active = playing ? index === activeTool && !progress.done : index === phase;
          const locked = playing && ((index >= 1 && progress.foam < 1) || (index === 2 && progress.rinse < 1));
          return (
            <button
              key={step}
              type="button"
              className={[styles.step, active && styles.stepActive, locked && styles.stepLocked].filter(Boolean).join(" ")}
              aria-pressed={active}
              aria-disabled={locked || undefined}
              onClick={() => chooseTool(index)}
            >
              <span>{playing && values[index] >= 1 ? `${step} ✓` : step}</span>
              {playing && <i className={styles.meter} aria-hidden="true"><b style={{ transform: `scaleX(${values[index]})` }} /></i>}
            </button>
          );
        })}
      </div>

      {playing ? (
        <p className={styles.hint} aria-live="polite">
          {progress.done ? "All three steps done." : TOOL_HELP[activeTool]}{" "}
          <button type="button" className={styles.textButton} onClick={stopPlaying}>Stop washing</button>
        </p>
      ) : (
        <div className={styles.start}>
          <button type="button" className={styles.cta} onClick={startPlaying}>Wash it yourself</button>
          <p className={styles.hint}>Or just watch. Drag the car to spin it, tap it for bubbles.</p>
        </div>
      )}
    </div>
  );
}
