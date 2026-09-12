"use client";

import { useEffect, useState } from "react";

type ImageItem = { id: string; url: string; title: string; category: string };

export default function PricingMediaStrip({ category, className = "" }: { category: string; className?: string }) {
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.append("category", category);
    query.set("limit", "8");
    fetch(`/api/images?${query.toString()}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => setImages(Array.isArray(items) ? items : []))
      .catch(() => setImages([]));
  }, [category]);

  if (!images.length) return null;

  return (
    <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} ${className}`}>
      {images.slice(0, 4).map((image, index) => (
        <figure key={image.id} className={`${index === 0 && images.length > 2 ? "col-span-2 row-span-2" : ""} overflow-hidden rounded-[24px] border border-white/10 bg-white/[.02]`}>
          <img src={image.url} alt={image.title} className="h-full min-h-44 w-full object-cover transition duration-500 hover:scale-[1.02]" />
        </figure>
      ))}
    </div>
  );
}
