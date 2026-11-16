"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  category: string;
  className?: string;
  fallbackCategory?: string;
  alt?: string;
};

export default function SitePhoto({
  category,
  className = "",
  fallbackCategory = "gallery",
  alt = "",
}: Props) {
  const positioning = /(?:^|\s)(?:absolute|fixed|sticky|relative)(?:\s|$)/.test(className) ? "" : "relative";
  const imageRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);

  // The photo is a normal image URL, so the browser starts fetching it as soon
  // as the page arrives. There is no separate "loading" step to show.
  const query = new URLSearchParams({ category });
  if (fallbackCategory && fallbackCategory !== category) query.set("fallback", fallbackCategory);
  const src = `/api/site-photo?${query.toString()}`;
  const priority = category === "hero" || category.endsWith("-hero");

  useEffect(() => {
    setMissing(false);
    // The image may already be loaded (from cache) before React attaches onLoad.
    const image = imageRef.current;
    setReady(Boolean(image && image.complete && image.naturalWidth > 0));
  }, [src]);

  return (
    <div className={`${positioning} overflow-hidden bg-[#1c1c1c] ${className}`}>
      {!missing && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${className.includes("object-contain") ? "object-contain" : "object-cover"} ${ready ? "opacity-100" : "opacity-0"}`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setReady(true)}
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}
