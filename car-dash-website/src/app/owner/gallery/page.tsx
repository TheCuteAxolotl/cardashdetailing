"use client";

import { useEffect, useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";
import { DEFAULT_PRICING_PAGES, PricingPageConfig, parsePricingConfig } from "@/lib/pricing-config";
import GalleryPlacementChecklist from "@/components/GalleryPlacementChecklist";
import GalleryMediaCard from "@/components/GalleryMediaCard";
import type { MediaItem } from "@/lib/media";
import { getMediaKind } from "@/lib/media";
import { STATIC_MEDIA_PLACEMENTS, getMediaPlacementPath, type MediaPlacement } from "@/lib/media-placements";

type Placement = MediaPlacement;
type MediaMode = "photo" | "video-file" | "video-url";

type PricingConfigs = {
  packages: PricingPageConfig;
  exterior: PricingPageConfig;
  interior: PricingPageConfig;
};

const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;

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

function safeVideoPath(file: File) {
  const clean = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "video.mp4";
  return `gallery/${Date.now()}-${clean}`;
}

const staticPlacements: Placement[] = STATIC_MEDIA_PLACEMENTS;


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
      {
        value: `pricing-${slug}-pkg-${pkg.id}-condition`,
        label: `${label} → ${pkg.name} → When Should I Get This? → Dirty Before Examples`,
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
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    ]).catch(() => { setLoadError(true); setMessage("Could not load media or placements. Refresh to try again."); }).finally(() => setLoading(false));
  }, []);

  const addMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      let url = "";
      if (mode === "photo") {
        if (!file) throw new Error("Choose a photo first.");
        url = await fileToCompressedDataUrl(file);
      } else if (mode === "video-file") {
        if (!file) throw new Error("Choose a video first.");
        if (!file.type.startsWith("video/")) throw new Error("Please choose a video file.");
        if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
          throw new Error("That video is over the 500 MB upload limit. Trim/compress it or use a video link.");
        }
        setUploadProgress(1);
        const blob = await upload(safeVideoPath(file), file, {
          access: "public",
          handleUploadUrl: "/api/media-upload",
          contentType: file.type || undefined,
          multipart: true,
          onUploadProgress: ({ percentage }) => setUploadProgress(Math.max(1, Math.round(percentage))),
        });
        url = blob.url;
      } else {
        url = videoUrl.trim();
        if (!url) throw new Error("Paste a video link first.");
      }

      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: title.trim(), category }),
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
      setUploadProgress(0);
    }
  };

  const updateMedia = async (item: MediaItem, updates: Partial<MediaItem>) => {
    const nextCategory = updates.category ?? item.category;
    if (placementByValue.get(nextCategory)?.photoOnly && getMediaKind(item.url) !== "image") {
      throw new Error("That placement only accepts photos.");
    }
    const response = await fetch(`/api/images/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: updates.title ?? item.title, category: nextCategory }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Update failed");
    await fetchMedia();
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete this photo/video?")) return;
    const response = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Delete failed.");
    await fetchMedia();
  };

  const attentionMedia = media.filter((item) => {
    const placement = placementByValue.get(item.category);
    return !placement || (placement.photoOnly && getMediaKind(item.url) !== "image");
  });

  const visibleMedia = filter === "all"
    ? media
    : filter === "attention"
      ? attentionMedia
      : media.filter((item) => (placementByValue.get(item.category)?.group || "Other") === filter);

  const assignUploadDestination = (value: string) => {
    if (!placementByValue.has(value)) return;
    setCategory(value);
    setMode("photo");
    setVideoUrl("");
    setFile(null);
    const input = document.getElementById("gallery-file") as HTMLInputElement | null;
    if (input) input.value = "";
    window.requestAnimationFrame(() =>
      document.getElementById("gallery-upload-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };
  const selectedPlacement = placementByValue.get(category);
  const selectedPhotos = media.filter(item => item.category === category && getMediaKind(item.url) === "image");
  const selectedVideos = media.filter(item => item.category === category && getMediaKind(item.url) !== "image");

  return (
    <div className="min-h-screen bg-[#121211] text-[#f4efe5]">
      <header className="border-b border-white/10 bg-[#191918]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#d6b779]">Car Dash · Owner workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Photos & media</h1>
            <p className="mt-2 text-sm text-[#b5aea3]">Organize your website photos by page, package, and service feature.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/owner/pricing-pages" className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold hover:border-[#d6b779]/60">Pricing pages</a>
            <a href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-[#d6b779]/45 bg-[#2b261f] px-4 py-2.5 text-xs font-semibold text-[#ebd5a7]">View website</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-7 sm:py-8">
        {loadError && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-100">
          Photo coverage could not be verified. Refresh this page before trusting missing-photo totals.
        </div>}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] xl:items-start">
          {loading ? (
            <div className="rounded-2xl border border-white/15 bg-[#20201f] p-6 text-sm text-[#bdb5aa]">Loading photo placements and existing uploads…</div>
          ) : !loadError ? (
            <GalleryPlacementChecklist placements={placements} media={media} selected={category} onSelect={assignUploadDestination} />
          ) : <div className="rounded-2xl border border-white/15 bg-[#20201f] p-6 text-sm">Unable to check photo coverage right now.</div>}

          <section id="gallery-upload-form" className="scroll-mt-24 rounded-2xl border border-[#d6b779]/30 bg-[#211f1b] p-4 sm:p-6 xl:sticky xl:top-5" aria-labelledby="gallery-upload-title">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6b779]">Add new media</p>
            <h2 id="gallery-upload-title" className="mt-1 text-xl font-semibold">Upload to a specific location</h2>
            <p className="mt-2 text-xs leading-6 text-[#b9b1a5]">Choose a placement from the checklist first. This upload will be assigned only to the location shown below.</p>

            <div className="mt-5 rounded-xl border border-[#d6b779]/30 bg-[#2d2922] p-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#e7c88f]">Selected photo location</p>
                <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                  (selectedPhotos.length ? "bg-[#304235] text-[#c2e2cc]" : "bg-[#4a3625] text-[#f4d5a7]")}>
                  {selectedPhotos.length ? selectedPhotos.length + " photo(s) added" : "Missing photo"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">{selectedPlacement?.label || "Public Gallery → Main Gallery"}</p>
              {selectedVideos.length > 0 && selectedPhotos.length === 0 && <p className="mt-2 text-xs text-[#d8bb95]">This location has video, but no photo assigned.</p>}
              {getMediaPlacementPath(category) && <a href={getMediaPlacementPath(category) || "#"} target="_blank" rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[#d6b779] underline">View this page</a>}
              <button type="button" onClick={() => document.getElementById("search-gallery-placements")?.focus()}
                className="mt-3 block text-xs font-semibold text-[#e5cfaa] underline">Choose a different location</button>
            </div>

            <form onSubmit={addMedia} className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-[#d9d1c6]">
                Media type
                <select value={mode} onChange={event => { setMode(event.target.value as MediaMode); setFile(null); setVideoUrl(""); }}
                  disabled={selectedPlacement?.photoOnly} className="mt-2 w-full rounded-xl border border-white/20 bg-[#2c2b28] px-4 py-3 text-base text-[#f4efe5] disabled:opacity-60">
                  <option value="photo">Photo upload</option>
                  {!selectedPlacement?.photoOnly && <option value="video-file">Video upload</option>}
                  {!selectedPlacement?.photoOnly && <option value="video-url">Video / social link</option>}
                </select>
              </label>
              {selectedPlacement?.photoOnly && <p className="text-xs leading-5 text-[#c6b8a0]">This spot displays photos only.</p>}

              {mode === "video-url" ? (
                <label className="block text-xs font-semibold text-[#d9d1c6]">
                  Video link
                  <input value={videoUrl} onChange={event => setVideoUrl(event.target.value)}
                    placeholder="YouTube, Vimeo, Instagram or direct video URL"
                    className="mt-2 w-full rounded-xl border border-white/20 bg-[#2c2b28] px-4 py-3 text-base text-[#f4efe5] outline-none placeholder:text-[#9c9387] focus:border-[#d6b779]" required />
                </label>
              ) : (
                <label className="block text-xs font-semibold text-[#d9d1c6]">
                  {mode === "photo" ? "Choose photo" : "Choose video"}
                  <input id="gallery-file" type="file" accept={mode === "photo" ? "image/*" : "video/mp4,video/webm,video/quicktime,video/*"}
                    onChange={event => setFile(event.target.files?.[0] || null)} required
                    className="mt-2 block w-full rounded-xl border border-white/20 bg-[#2c2b28] p-3 text-sm text-[#f4efe5] file:mr-3 file:rounded-lg file:border-0 file:bg-[#d6b779] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#171717]" />
                  <span className="mt-2 block text-[11px] font-normal leading-5 text-[#b6aea2]">
                    {category === "home-360" ? "Upload slideshow frames in order. The website rotates through your uploaded photos."
                      : mode === "photo" ? "Photos are compressed automatically before uploading."
                      : "Videos up to 500 MB can be sent directly to media storage."}
                  </span>
                </label>
              )}
              <label className="block text-xs font-semibold text-[#d9d1c6]">
                Title (optional)
                <input value={title} onChange={event => setTitle(event.target.value)}
                  placeholder="Before, After, Hand wash…" className="mt-2 w-full rounded-xl border border-white/20 bg-[#2c2b28] px-4 py-3 text-base text-[#f4efe5] outline-none placeholder:text-[#9c9387] focus:border-[#d6b779]" />
              </label>
              <button type="submit" disabled={saving || loading || loadError || !selectedPlacement}
                className="w-full rounded-xl bg-[#d6b779] px-5 py-3.5 text-sm font-bold text-[#171717] hover:bg-[#e7cb97] disabled:opacity-40">
                {saving ? (mode === "video-file" && uploadProgress > 0 ? "Uploading " + uploadProgress + "%" : "Processing…") : "Add to selected location"}
              </button>
              {message && <p role="status" className="rounded-xl border border-white/10 bg-[#292824] p-3 text-xs leading-5 text-[#e2d5bd]">{message}</p>}
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-white/15 bg-[#1d1d1c] p-4 sm:p-6" aria-labelledby="gallery-library-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6b779]">Already uploaded</p>
              <h2 id="gallery-library-title" className="mt-1 text-xl font-semibold">Your media library</h2>
              <p className="mt-1 text-xs leading-6 text-[#aba397]">Manage titles and placements without scrolling through hundreds of dropdown options.</p>
            </div>
            <p className="text-sm text-[#c2b6a3]">{visibleMedia.length} shown of {media.length} uploads</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-[#d4cbbf]">Show media from
              <select value={filter} onChange={event=>setFilter(event.target.value)}
                className="ml-2 rounded-xl border border-white/20 bg-[#2c2b28] px-3 py-2.5 text-sm text-[#f4efe5]">
                <option value="all">All pages</option>
                {attentionMedia.length>0 && <option value="attention">Needs attention ({attentionMedia.length})</option>}
                {groups.map(group=><option key={group} value={group}>{group}</option>)}
                {media.some(item=>!placementByValue.has(item.category)) && <option value="Other">Legacy / custom</option>}
              </select>
            </label>
            {attentionMedia.length>0 && <p className="text-xs text-[#e5c995]">
              {attentionMedia.length} upload(s) need a new placement or correct media type.
            </p>}
          </div>
          {!loading && !visibleMedia.length && <p className="mt-6 rounded-xl border border-white/10 bg-[#262522] px-5 py-10 text-center text-sm text-[#b9b0a4]">
            No media in this category yet. Choose a slot above and upload a photo.
          </p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMedia.map(item => <GalleryMediaCard key={item.id} item={item} placements={placements}
              onUpdate={async (original, nextCategory, nextTitle) => {
                try { await updateMedia(original, {category:nextCategory, title:nextTitle ?? original.title}); }
                catch (error) { setMessage(error instanceof Error ? error.message : "Could not update media."); }
              }}
              onDelete={deleteMedia} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
