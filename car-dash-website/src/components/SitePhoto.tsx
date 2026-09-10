"use client";

import { useEffect, useState } from "react";

type GalleryImage = { id: string; url: string; title: string; category: string };

type Props = {
  category: string;
  className?: string;
  fallbackCategory?: string;
  alt?: string;
};

export default function SitePhoto({ category, className = "", fallbackCategory = "gallery", alt = "" }: Props) {
  const [image, setImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/images", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: GalleryImage[]) => {
        if (cancelled) return;
        const selected =
          items.find((item) => item.category === category) ||
          items.find((item) => item.category === fallbackCategory) ||
          items[0] ||
          null;
        setImage(selected);
      })
      .catch(() => !cancelled && setImage(null));
    return () => {
      cancelled = true;
    };
  }, [category, fallbackCategory]);

  if (!image) {
    return (
      <div className={`bg-[linear-gradient(135deg,#111,#090909_55%,#1a0909)] ${className}`} aria-hidden="true" />
    );
  }

  return <img src={image.url} alt={alt || image.title} className={className} loading={category === "hero" ? "eager" : "lazy"} />;
}
