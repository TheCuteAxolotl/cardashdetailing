"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media";
import { isImageMedia } from "@/lib/media";

type Props = {
  frames: MediaItem[];
  className?: string;
  onInteractionChange?: (active: boolean) => void;
};

function wrap(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

const AUTOPLAY_MS = 5000;
const FADE_MS = 900;

export default function Hero360Viewer({ frames, className = "", onInteractionChange }: Props) {
  const imageFrames = useMemo(
    () => frames.filter((item) => isImageMedia(item.url)),
    [frames]
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);
  const dragging = useRef(false);
  const interactionTimer = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
    onInteractionChange?.(false);

    imageFrames.forEach((frame) => {
      const image = new Image();
      image.src = frame.url;
    });
  }, [imageFrames, onInteractionChange]);

  useEffect(() => {
    if (imageFrames.length <= 1 || paused) return;

    const timer = window.setInterval(() => {
      setIndex((value) => wrap(value + 1, imageFrames.length));
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [imageFrames.length, paused]);

  if (imageFrames.length === 0) {
    return <div className={`bg-[#171411] ${className}`} aria-hidden="true" />;
  }

  const canAdvance = imageFrames.length > 1;

  const goTo = (nextIndex: number) => {
    if (!canAdvance) return;
    setIndex(wrap(nextIndex, imageFrames.length));
  };

  const step = (direction: number) => {
    if (!canAdvance) return;
    setIndex((current) => wrap(current + direction, imageFrames.length));
  };

  const showInteraction = () => {
    onInteractionChange?.(true);
    if (interactionTimer.current) window.clearTimeout(interactionTimer.current);
  };

  const settleInteraction = (delay = 500) => {
    if (interactionTimer.current) window.clearTimeout(interactionTimer.current);
    interactionTimer.current = window.setTimeout(() => onInteractionChange?.(false), delay);
  };

  return (
    <div
      className={`group relative cursor-grab select-none overflow-hidden bg-[#171411] outline-none active:cursor-grabbing ${className}`}
      role={canAdvance ? "region" : "img"}
      aria-label={
        canAdvance
          ? "Car Dash Detailing homepage photo slideshow"
          : imageFrames[0].title || "Car Dash Detailing photo"
      }
      tabIndex={canAdvance ? 0 : -1}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        if (!dragging.current) settleInteraction(250);
      }}
      onPointerDown={(event) => {
        if (!canAdvance) return;
        dragging.current = true;
        dragX.current = event.clientX;
        setPaused(true);
        showInteraction();
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!canAdvance || !dragging.current || dragX.current == null) return;
        const delta = event.clientX - dragX.current;
        if (Math.abs(delta) < 24) return;
        step(delta < 0 ? 1 : -1);
        dragX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        dragging.current = false;
        dragX.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        setPaused(false);
        settleInteraction();
      }}
      onPointerCancel={() => {
        dragging.current = false;
        dragX.current = null;
        setPaused(false);
        settleInteraction();
      }}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showInteraction();
          step(-1);
          settleInteraction();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          showInteraction();
          step(1);
          settleInteraction();
        }
      }}
      style={{ touchAction: canAdvance ? "pan-y" : undefined }}
    >
      {imageFrames.map((frame, frameIndex) => {
        const active = frameIndex === wrap(index, imageFrames.length);
        return (
          <img
            key={frame.id || `${frame.url}-${frameIndex}`}
            src={frame.url}
            alt={frame.title || `Car Dash Detailing hero photo ${frameIndex + 1}`}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
            loading={frameIndex === 0 ? "eager" : "lazy"}
            fetchPriority={frameIndex === 0 ? "high" : "auto"}
            aria-hidden={!active}
          />
        );
      })}

      {canAdvance && (
        <>
          <button
            type="button"
            onClick={() => {
              showInteraction();
              step(-1);
              settleInteraction();
            }}
            className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#F7F5F2]/18 bg-[#171411]/42 text-xl text-[#F7F5F2]/94 opacity-80 shadow-lg backdrop-blur-xl transition hover:bg-white hover:text-[#171411] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#C0AB9A] sm:opacity-0 sm:group-hover:opacity-100 sm:left-4"
            aria-label="Previous hero photo"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => {
              showInteraction();
              step(1);
              settleInteraction();
            }}
            className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#F7F5F2]/18 bg-[#171411]/42 text-xl text-[#F7F5F2]/94 opacity-80 shadow-lg backdrop-blur-xl transition hover:bg-white hover:text-[#171411] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#C0AB9A] sm:opacity-0 sm:group-hover:opacity-100 sm:right-4"
            aria-label="Next hero photo"
          >
            ›
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#F7F5F2]/14 bg-[#171411]/38 px-2.5 py-2 backdrop-blur-xl">
            {imageFrames.map((frame, dotIndex) => (
              <button
                key={`dot-${frame.id || dotIndex}`}
                type="button"
                onClick={() => {
                  showInteraction();
                  goTo(dotIndex);
                  settleInteraction();
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${dotIndex === wrap(index, imageFrames.length) ? "w-5 bg-[#F7F5F2]" : "w-1.5 bg-[#C0AB9A]/55 hover:bg-[#F7F5F2]/70"}`}
                aria-label={`Show hero photo ${dotIndex + 1}`}
                aria-current={dotIndex === wrap(index, imageFrames.length) ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
