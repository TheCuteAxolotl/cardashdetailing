"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  title: string;
  category: string;
};

export default function HeroBackdrop() {
  const [image, setImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/images", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: GalleryImage[]) => {
        if (cancelled) return;
        const hero =
          items.find((item) => item.category === "hero") ||
          items.find((item) => item.category !== "hero") ||
          items[0] ||
          null;
        setImage(hero);
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!image) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(220,38,38,.22),transparent_28%),linear-gradient(120deg,#050505_15%,#0d0d0d_60%,#1a0808)]" />
    );
  }

  return (
    <>
      <img
        src={image.url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,3,.96)_0%,rgba(3,3,3,.86)_37%,rgba(3,3,3,.47)_68%,rgba(3,3,3,.64)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.16)_0%,rgba(0,0,0,.04)_55%,rgba(0,0,0,.82)_100%)]" />
    </>
  );
}
