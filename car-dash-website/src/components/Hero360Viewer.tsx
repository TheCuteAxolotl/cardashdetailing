"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media";
import { isImageMedia } from "@/lib/media";

type Props = {
  frames: MediaItem[];
  className?: string;
};

function wrap(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export default function Hero360Viewer({ frames, className = "" }: Props) {
  const imageFrames = frames.filter((item) => isImageMedia(item.url));
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
    imageFrames.forEach((frame) => {
      const image = new Image();
      image.src = frame.url;
    });
  }, [frames]);

  if (imageFrames.length === 0) {
    return <div className={`bg-[#060606] ${className}`} aria-hidden="true" />;
  }

  const current = imageFrames[wrap(index, imageFrames.length)];
  const canRotate = imageFrames.length > 1;

  const rotateBy = (amount: number) => {
    if (!canRotate) return;
    setIndex((value) => wrap(value + amount, imageFrames.length));
  };

  return (
    <div
      className={`relative select-none overflow-hidden bg-black outline-none ${dragging ? "cursor-grabbing" : canRotate ? "cursor-grab" : ""} ${className}`}
      style={{ touchAction: "pan-y" }}
      role={canRotate ? "slider" : "img"}
      aria-label={canRotate ? "360 degree photo viewer. Drag or swipe left and right to rotate." : current.title || "Car Dash Detailing photo"}
      aria-valuemin={canRotate ? 1 : undefined}
      aria-valuemax={canRotate ? imageFrames.length : undefined}
      aria-valuenow={canRotate ? wrap(index, imageFrames.length) + 1 : undefined}
      tabIndex={canRotate ? 0 : -1}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          rotateBy(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          rotateBy(1);
        }
      }}
      onPointerDown={(event) => {
        if (!canRotate) return;
        lastX.current = event.clientX;
        setDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!canRotate || lastX.current === null) return;
        const delta = event.clientX - lastX.current;
        const sensitivity = 12;
        const steps = Math.trunc(delta / sensitivity);
        if (steps === 0) return;
        setIndex((value) => wrap(value - steps, imageFrames.length));
        lastX.current += steps * sensitivity;
      }}
      onPointerUp={(event) => {
        lastX.current = null;
        setDragging(false);
        try {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        } catch {
          // Pointer capture may already be released by the browser.
        }
      }}
      onPointerCancel={() => {
        lastX.current = null;
        setDragging(false);
      }}
    >
      <img
        src={current.url}
        alt={current.title || "Car Dash Detailing 360 view"}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
      />

      {canRotate && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/80 backdrop-blur-md sm:left-5 sm:top-5">
            ↔ Drag / swipe to rotate
          </div>
          <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[10px] font-semibold text-white/70 backdrop-blur-md sm:right-5 sm:top-5">
            {wrap(index, imageFrames.length) + 1} / {imageFrames.length}
          </div>

          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              rotateBy(-1);
            }}
            className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-2xl text-white/90 backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70 sm:left-4"
            aria-label="Previous 360 frame"
          >
            ‹
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              rotateBy(1);
            }}
            className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-2xl text-white/90 backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70 sm:right-4"
            aria-label="Next 360 frame"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
