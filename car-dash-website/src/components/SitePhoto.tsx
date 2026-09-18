"use client";

import { useEffect, useState } from "react";
import { isImageMedia } from "@/lib/media";

type GalleryImage = { id: string; url: string; title: string; category: string };

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
  const [image, setImage] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageReady(false);
    setImage(null);

    const query = new URLSearchParams();
    query.append("category", category);
    if (fallbackCategory && fallbackCategory !== category) {
      query.append("category", fallbackCategory);
    }
    query.set("limit", "50");

    fetch(`/api/images?${query.toString()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: GalleryImage[]) => {
        if (cancelled) return;

        const imageItems = items.filter((item) => isImageMedia(item.url));
        const selected =
          imageItems.find((item) => item.category === category) ||
          imageItems.find((item) => item.category === fallbackCategory) ||
          imageItems[0] ||
          null;

        setImage(selected);
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, fallbackCategory]);

  if (!image) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#DDEFF6,#EEF7F5_48%,#E5F1F0)] ${className}`}
        aria-label={loading ? "Loading photo" : "Photo placeholder"}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,.85),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(110,174,198,.18),transparent_30%)]" />
        <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-black/[.055] bg-white/52 px-4 py-3 text-center text-[#17212A]/45 backdrop-blur-xl">
          <span className={`h-2 w-2 rounded-full bg-[#6EAEC6] ${loading ? "animate-pulse" : ""}`} />
          <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
            {loading ? "Loading photo" : "Photo coming soon"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[linear-gradient(135deg,#DDEFF6,#EEF7F5)] ${className}`}>
      {!imageReady && (
        <div className="absolute inset-0 z-0 animate-pulse bg-[linear-gradient(135deg,#DDEFF6,#EEF7F5_48%,#E5F1F0)]" aria-hidden="true" />
      )}
      <img
        src={image.url}
        alt={alt || image.title}
        className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${className.includes("object-contain") ? "object-contain" : "object-cover"} ${imageReady ? "opacity-100" : "opacity-0"}`}
        loading={category === "hero" || category.endsWith("-hero") ? "eager" : "lazy"}
        fetchPriority={category === "hero" || category.endsWith("-hero") ? "high" : "auto"}
        decoding="async"
        onLoad={() => setImageReady(true)}
        onError={() => setImageReady(true)}
      />
    </div>
  );
}
