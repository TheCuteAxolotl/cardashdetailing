"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICING_PAGES, PricingPageConfig, parsePricingConfig } from "@/lib/pricing-config";
import { MediaVisual } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/media";

type Placement = { value: string; label: string; group: string };
type MediaMode = "photo" | "video-file" | "video-url";

type PricingConfigs = {
  packages: PricingPageConfig;
  exterior: PricingPageConfig;
  interior: PricingPageConfig;
};

const MAX_VIDEO_UPLOAD_BYTES = 2_500_000;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const source = await createImageBitmap(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function videoFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) throw new Error("Please choose a video file.");
  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error("That video is too large for a direct upload. Use a video link instead, or trim/compress it under 2.5 MB.");
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Your browser could not read this video."));
    reader.readAsDataURL(file);
  });
}

const staticPlacements: Placement[] = [
  { value: "gallery", label: "Public Gallery → Gallery Grid", group: "Public Gallery" },
  { value: "before-after", label: "Public Gallery → Before & After", group: "Public Gallery" },
  { value: "portfolio", label: "Public Gallery → Portfolio", group: "Public Gallery" },

  { value: "hero", label: "Homepage → Main Hero Background (photo only)", group: "Homepage" },
  { value: "home-showcase-primary", label: "Homepage → Showcase → Large Media", group: "Homepage" },
  { value: "home-showcase-secondary", label: "Homepage → Showcase → Small Media", group: "Homepage" },
  { value: "home-story", label: "Homepage → Story Section", group: "Homepage" },
  { value: "home-services-bg", label: "Homepage → Services Section", group: "Homepage" },
  { value: "home-cta-bg", label: "Homepage → Booking CTA", group: "Homepage" },

  { value: "pricing-car-packages-hero", label: "Car Detailing Packages → Hero Background (photo only)", group: "Car Detailing Packages" },
  { value: "pricing-car-packages-intro", label: "Car Detailing Packages → Intro Media Strip", group: "Car Detailing Packages" },
  { value: "pricing-car-packages-results", label: "Car Detailing Packages → Recent Results", group: "Car Detailing Packages" },

  { value: "pricing-exterior-hero", label: "Exterior Detailing → Hero Background (photo only)", group: "Exterior Detailing" },
  { value: "pricing-exterior-intro", label: "Exterior Detailing → Intro Media Strip", group: "Exterior Detailing" },
  { value: "pricing-exterior-results", label: "Exterior Detailing → Recent Results", group: "Exterior Detailing" },

  { value: "pricing-interior-hero", label: "Interior Detailing → Hero Background (photo only)", group: "Interior Detailing" },
  { value: "pricing-interior-intro", label: "Interior Detailing → Intro Media Strip", group: "Interior Detailing" },
  { value: "pricing-interior-results", label: "Interior Detailing → Recent Results", group: "Interior Detailing" },

  { value: "services-hero", label: "Services Hub → Hero Background (photo only)", group: "Services Hub" },
  { value: "marine-hero", label: "Marine Detailing → Hero Background (photo only)", group: "Marine Detailing" },
  { value: "marine-services", label: "Marine Detailing → Services Media", group: "Marine Detailing" },
  { value: "marine-results", label: "Marine Detailing → Results Media", group: "Marine Detailing" },
  { value: "gallery-hero", label: "Gallery → Hero Background (photo only)", group: "Other Pages" },
  { value: "reviews-hero", label: "Reviews → Hero Background (photo only)", group: "Other Pages" },
  { value: "contact-hero", label: "Booking / Contact → Hero Background (photo only)", group: "Other Pages" },
  { value: "about-hero", label: "About Car Dash → Hero Background (photo only)", group: "Explore Pages" },
  { value: "about-story", label: "About Car Dash → Story Media", group: "Explore Pages" },
  { value: "about-values-bg", label: "About Car Dash → Values Section", group: "Explore Pages" },
  { value: "paint-correction-hero", label: "Paint Correction → Hero Background (photo only)", group: "Explore Pages" },
  { value: "paint-correction-results", label: "Paint Correction → Results Media", group: "Explore Pages" },
  { value: "ceramic-coatings-hero", label: "Ceramic Coatings → Hero Background (photo only)", group: "Explore Pages" },
  { value: "ceramic-results", label: "Ceramic Coatings → Results Media", group: "Explore Pages" },
  { value: "products-hero", label: "Products We Use → Hero Background (photo only)", group: "Explore Pages" },
  { value: "products-gallery", label: "Products We Use → Product Media", group: "Explore Pages" },
  { value: "faq-hero", label: "FAQ → Hero Background (photo only)", group: "Other Pages" },
];

function dynamicPackagePlacements(configs: PricingConfigs): Placement[] {
  const defs = [
    ["packages", "car-packages", "Car Detailing Packages"],
    ["exterior", "exterior", "Exterior Detailing"],
    ["interior", "interior", "Interior Detailing"],
  ] as const;

  return defs.flatMap(([key, slug, label]) =>
    configs[key].packages.flatMap((pkg) => [
      {
        value: `pricing-${slug}-pkg-${pkg.id}`,
        label: `${label} → ${pkg.name} → Before/After + Package Media`,
        group: label,
      },
      ...pkg.features.map((feature, index) => ({
        value: `pricing-${slug}-pkg-${pkg.id}-feature-${index + 1}`,
        label: `${label} → ${pkg.name} → Included Item → ${feature}`,
        group: label,
      })),
    ])
  );
}

export default function OwnerGallery() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [configs, setConfigs] = useState<PricingConfigs>({
    packages: DEFAULT_PRICING_PAGES.packages,
    exterior: DEFAULT_PRICING_PAGES.exterior,
    interior: DEFAULT_PRICING_PAGES.interior,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<MediaMode>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gallery");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  const placements = useMemo(() => [...staticPlacements, ...dynamicPackagePlacements(configs)], [configs]);
  const placementByValue = useMemo(() => new Map(placements.map((item) => [item.value, item])), [placements]);
  const groups = useMemo(() => [...new Set(placements.map((item) => item.group))], [placements]);

  const fetchMedia = async () => {
    const response = await fetch("/api/images", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch media");
    setMedia(await response.json());
  };

  useEffect(() => {
    Promise.all([
      fetchMedia(),
      fetch("/api/site-content", { cache: "no-store" }).then((r) => r.json()).then((content) => setConfigs({
        packages: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
        exterior: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
        interior: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
      })),
    ]).catch(() => setMessage("Could not load media or placements.")).finally(() => setLoading(false));
  }, []);

  const addMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      let url = "";
      let fallbackTitle = "Media";
      if (mode === "photo") {
        if (!file) throw new Error("Choose a photo first.");
        url = await fileToCompressedDataUrl(file);
        fallbackTitle = file.name.replace(/\.[^.]+$/, "");
      } else if (mode === "video-file") {
        if (!file) throw new Error("Choose a video first.");
        url = await videoFileToDataUrl(file);
        fallbackTitle = file.name.replace(/\.[^.]+$/, "");
      } else {
        url = videoUrl.trim();
        if (!url) throw new Error("Paste a video link first.");
        fallbackTitle = "Video";
      }

      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: title || fallbackTitle, category }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      setVideoUrl("");
      setTitle("");
      const input = document.getElementById("gallery-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await fetchMedia();
      setMessage(`Media added to ${placementByValue.get(category)?.label || category}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateMedia = async (item: MediaItem, updates: Partial<MediaItem>) => {
    const response = await fetch(`/api/images/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: updates.title ?? item.title, category: updates.category ?? item.category }),
    });
    if (!response.ok) throw new Error("Update failed");
    await fetchMedia();
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete this photo/video?")) return;
    const response = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Delete failed.");
    await fetchMedia();
  };

  const visibleMedia = filter === "all" ? media : media.filter((item) => (placementByValue.get(item.category)?.group || "Other") === filter);

  const PlacementSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm">
      {groups.map((group) => <optgroup key={group} label={group}>{placements.filter((item) => item.group === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}
      {!placementByValue.has(value) && <option value={value}>Legacy / custom placement: {value}</option>}
    </select>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6">
          <div><h1 className="text-2xl font-bold">Photos & Videos</h1><p className="mt-1 text-sm text-neutral-400">Add proof right where customers are deciding what to book.</p></div>
          <div className="flex gap-2"><a href="/owner/pricing-pages" className="rounded-lg border border-white/10 px-4 py-2 text-sm">Pricing Pages</a><a href="/owner/dashboard" className="rounded-lg bg-[#FF2D2D] px-4 py-2 text-sm font-medium text-[#0D0D0D]">Back</a></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 rounded-2xl border border-[#FF2D2D]/15 bg-[#FF2D2D]/[.045] p-4 text-sm leading-6 text-white/60">
          <strong className="text-white">Package proof is now built in.</strong> Add a Before/After photo or clip to a package, or attach media to one exact included item like “Foam + hand wash.” Customers only see the small preview when media exists, then they can tap it to enlarge.
        </div>

        <form onSubmit={addMedia} className="grid gap-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Media type</label>
            <select value={mode} onChange={(e) => { setMode(e.target.value as MediaMode); setFile(null); setVideoUrl(""); }} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm">
              <option value="photo">Photo upload</option>
              <option value="video-file">Small video upload</option>
              <option value="video-url">Video link</option>
            </select>
          </div>

          <div className="md:col-span-2">
            {mode === "video-url" ? (
              <>
                <label className="mb-2 block text-sm font-medium">Video link</label>
                <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct .mp4 link" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" required />
                <p className="mt-2 text-xs text-neutral-500">Best for normal phone-length videos. YouTube links can be unlisted.</p>
              </>
            ) : (
              <>
                <label className="mb-2 block text-sm font-medium">{mode === "photo" ? "Photo" : "Video clip"}</label>
                <input id="gallery-file" type="file" accept={mode === "photo" ? "image/*" : "video/mp4,video/webm,video/quicktime,video/*"} onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" required />
                <p className="mt-2 text-xs text-neutral-500">{mode === "photo" ? "Photos are resized/compressed automatically." : "Direct video uploads are limited to 2.5 MB. Use a video link for anything larger."}</p>
              </>
            )}
          </div>

          <div><label className="mb-2 block text-sm font-medium">Label</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Before, After, Hand wash…" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" /></div>
          <div className="md:col-span-3"><label className="mb-2 block text-sm font-medium">Where should it appear?</label><PlacementSelect value={category} onChange={setCategory} /><p className="mt-2 text-[11px] leading-4 text-neutral-500">Current destination: {placementByValue.get(category)?.label || category}</p></div>
          <div className="flex items-end"><button disabled={saving} className="w-full rounded-xl bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] disabled:opacity-50">{saving ? "Processing…" : "Add Media"}</button></div>
          {message && <div className="md:col-span-4 text-sm text-neutral-300">{message}</div>}
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-2"><button onClick={() => setFilter("all")} className={`rounded-full px-4 py-2 text-xs ${filter === "all" ? "bg-[#FF2D2D] text-[#0D0D0D]" : "border border-white/10 text-white/55"}`}>All Media</button>{groups.map((group) => <button key={group} onClick={() => setFilter(group)} className={`rounded-full px-4 py-2 text-xs ${filter === group ? "bg-[#FF2D2D] text-[#0D0D0D]" : "border border-white/10 text-white/55"}`}>{group}</button>)}</div>

        {loading ? <p className="py-12 text-neutral-400">Loading…</p> : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMedia.map((item) => {
              const placement = placementByValue.get(item.category);
              return <article key={item.id} className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
                <div className="relative h-56 bg-black"><MediaVisual item={item} thumbnail className="h-full w-full object-cover" /></div>
                <div className="space-y-3 p-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Current Placement</p><p className="mt-1 text-sm font-medium text-white">{placement?.label || item.category}</p></div>
                  <input defaultValue={item.title} onBlur={(e) => { if (e.target.value !== item.title) updateMedia(item, { title: e.target.value }).catch(() => setMessage("Rename failed.")); }} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm" />
                  <PlacementSelect value={item.category} onChange={(value) => updateMedia(item, { category: value }).catch(() => setMessage("Update failed."))} />
                  <button onClick={() => deleteMedia(item.id)} className="w-full rounded-lg bg-red-900/70 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-900">Delete Media</button>
                </div>
              </article>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
