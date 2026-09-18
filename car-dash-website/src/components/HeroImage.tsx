"use client";

import { useEffect, useState } from "react";
import { isImageMedia } from "@/lib/media";

type GalleryImage = { id: string; url: string; title: string; category: string };

export default function HeroImage() {
  const [image, setImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetch("/api/images?category=hero&limit=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((items: GalleryImage[]) => setImage(items.find((item) => isImageMedia(item.url)) || null))
      .catch(() => setImage(null));
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[3rem] bg-[#C0AB9A]/16 blur-3xl" />
      <div className="overflow-hidden rounded-[2rem] border border-[#C0AB9A]/25 bg-[#3F3027] shadow-[0_30px_100px_rgba(23,20,17,.55)]">
        {image ? (
          <div className="relative">
            <img src={image.url} alt={image.title} className="h-[430px] w-full object-cover sm:h-[510px]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171411]/92 via-[#171411]/12 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#C0AB9A]">Featured Work</p>
              <div className="mt-2 flex items-end justify-between gap-5">
                <h2 className="max-w-md text-xl font-black sm:text-2xl">{image.title}</h2>
                <span className="shrink-0 rounded-full border border-[#F7F5F2]/15 bg-[#171411]/42 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F7F5F2] backdrop-blur">Car Dash</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-[430px] items-end overflow-hidden p-7 sm:h-[510px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(192,171,154,.22),transparent_38%),linear-gradient(145deg,#3F3027,#171411)]" />
            <div className="absolute inset-7 rounded-[1.4rem] border border-[#F7F5F2]/10" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#C0AB9A]">Homepage Hero</p>
              <p className="mt-2 max-w-sm text-2xl font-black">Upload a Hero photo from your Owner Dashboard and it’ll show here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
