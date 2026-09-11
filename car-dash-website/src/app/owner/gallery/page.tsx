"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICING_PAGES, PricingPageConfig, parsePricingConfig } from "@/lib/pricing-config";

type ImageItem = { id: string; url: string; title: string; category: string };
type Placement = { value: string; label: string; group: string };

type PricingConfigs = {
  packages: PricingPageConfig;
  exterior: PricingPageConfig;
  interior: PricingPageConfig;
};

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

const staticPlacements: Placement[] = [
  { value: "gallery", label: "Public Gallery → Gallery Grid", group: "Public Gallery" },
  { value: "before-after", label: "Public Gallery → Before & After", group: "Public Gallery" },
  { value: "portfolio", label: "Public Gallery → Portfolio", group: "Public Gallery" },

  { value: "hero", label: "Homepage → Main Hero Background", group: "Homepage" },
  { value: "home-showcase-primary", label: "Homepage → Showcase → Large Photo", group: "Homepage" },
  { value: "home-showcase-secondary", label: "Homepage → Showcase → Small Photos", group: "Homepage" },
  { value: "home-story", label: "Homepage → Story Section", group: "Homepage" },
  { value: "home-services-bg", label: "Homepage → Services Section", group: "Homepage" },
  { value: "home-cta-bg", label: "Homepage → Booking CTA", group: "Homepage" },

  { value: "pricing-car-packages-hero", label: "Car Detailing Packages → Hero Background", group: "Car Detailing Packages" },
  { value: "pricing-car-packages-intro", label: "Car Detailing Packages → Intro Photo Strip", group: "Car Detailing Packages" },
  { value: "pricing-car-packages-results", label: "Car Detailing Packages → Recent Results", group: "Car Detailing Packages" },

  { value: "pricing-exterior-hero", label: "Exterior Detailing → Hero Background", group: "Exterior Detailing" },
  { value: "pricing-exterior-intro", label: "Exterior Detailing → Intro Photo Strip", group: "Exterior Detailing" },
  { value: "pricing-exterior-results", label: "Exterior Detailing → Recent Results", group: "Exterior Detailing" },

  { value: "pricing-interior-hero", label: "Interior Detailing → Hero Background", group: "Interior Detailing" },
  { value: "pricing-interior-intro", label: "Interior Detailing → Intro Photo Strip", group: "Interior Detailing" },
  { value: "pricing-interior-results", label: "Interior Detailing → Recent Results", group: "Interior Detailing" },

  { value: "services-hero", label: "Services Hub → Hero Background", group: "Services Hub" },
  { value: "marine-hero", label: "Marine Detailing → Hero Background", group: "Marine Detailing" },
  { value: "marine-services", label: "Marine Detailing → Services Photos", group: "Marine Detailing" },
  { value: "marine-results", label: "Marine Detailing → Results Photos", group: "Marine Detailing" },
  { value: "gallery-hero", label: "Gallery → Hero Background", group: "Other Pages" },
  { value: "reviews-hero", label: "Reviews → Hero Background", group: "Other Pages" },
  { value: "contact-hero", label: "Booking / Contact → Hero Background", group: "Other Pages" },
  { value: "about-hero", label: "About Car Dash → Hero Background", group: "Explore Pages" },
  { value: "about-story", label: "About Car Dash → Story Photos", group: "Explore Pages" },
  { value: "about-values-bg", label: "About Car Dash → Values Section", group: "Explore Pages" },
  { value: "paint-correction-hero", label: "Paint Correction → Hero Background", group: "Explore Pages" },
  { value: "paint-correction-results", label: "Paint Correction → Results Photos", group: "Explore Pages" },
  { value: "ceramic-coatings-hero", label: "Ceramic Coatings → Hero Background", group: "Explore Pages" },
  { value: "ceramic-results", label: "Ceramic Coatings → Results Photos", group: "Explore Pages" },
  { value: "products-hero", label: "Products We Use → Hero Background", group: "Explore Pages" },
  { value: "products-gallery", label: "Products We Use → Product Photos", group: "Explore Pages" },
  { value: "faq-hero", label: "FAQ → Hero Background", group: "Other Pages" },
];

function dynamicPackagePlacements(configs: PricingConfigs): Placement[] {
  const defs = [
    ["packages", "car-packages", "Car Detailing Packages"],
    ["exterior", "exterior", "Exterior Detailing"],
    ["interior", "interior", "Interior Detailing"],
  ] as const;
  return defs.flatMap(([key, slug, label]) => configs[key].packages.map((pkg) => ({
    value: `pricing-${slug}-pkg-${pkg.id}`,
    label: `${label} → ${pkg.name} → Package Photos`,
    group: label,
  })));
}

export default function OwnerGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [configs, setConfigs] = useState<PricingConfigs>({
    packages: DEFAULT_PRICING_PAGES.packages,
    exterior: DEFAULT_PRICING_PAGES.exterior,
    interior: DEFAULT_PRICING_PAGES.interior,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gallery");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  const placements = useMemo(() => [...staticPlacements, ...dynamicPackagePlacements(configs)], [configs]);
  const placementByValue = useMemo(() => new Map(placements.map((item) => [item.value, item])), [placements]);
  const groups = useMemo(() => [...new Set(placements.map((item) => item.group))], [placements]);

  const fetchImages = async () => {
    const response = await fetch("/api/images", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch images");
    setImages(await response.json());
  };

  useEffect(() => {
    Promise.all([
      fetchImages(),
      fetch("/api/site-content", { cache: "no-store" }).then((r) => r.json()).then((content) => setConfigs({
        packages: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
        exterior: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
        interior: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
      })),
    ]).catch(() => setMessage("Could not load photos or placements.")).finally(() => setLoading(false));
  }, []);

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMessage("Choose a photo first.");
    setSaving(true);
    setMessage("");
    try {
      const url = await fileToCompressedDataUrl(file);
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: title || file.name.replace(/\.[^.]+$/, ""), category }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setFile(null);
      setTitle("");
      const input = document.getElementById("gallery-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await fetchImages();
      setMessage(`Photo added to ${placementByValue.get(category)?.label || category}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateImage = async (image: ImageItem, updates: Partial<ImageItem>) => {
    const response = await fetch(`/api/images/${image.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: updates.title ?? image.title, category: updates.category ?? image.category }),
    });
    if (!response.ok) throw new Error("Update failed");
    await fetchImages();
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    const response = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Delete failed.");
    await fetchImages();
  };

  const visibleImages = filter === "all" ? images : images.filter((image) => (placementByValue.get(image.category)?.group || "Other") === filter);

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
          <div><h1 className="text-2xl font-bold">Photos & Media</h1><p className="mt-1 text-sm text-neutral-400">Every placement is labeled by page → section → exact destination, so you know where each photo goes.</p></div>
          <div className="flex gap-2"><a href="/owner/pricing-pages" className="rounded-lg border border-white/10 px-4 py-2 text-sm">Pricing Pages</a><a href="/owner/dashboard" className="rounded-lg bg-[#FF2D2D] px-4 py-2 text-sm font-medium text-[#0D0D0D]">Back</a></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 rounded-2xl border border-[#FF2D2D]/15 bg-[#FF2D2D]/[.045] p-4 text-sm leading-6 text-white/60">
          <strong className="text-white">Multiple photos are allowed in the same placement.</strong> Pricing-page package sections can hold several photos; the public page automatically turns them into a clean photo layout.
        </div>

        <form onSubmit={addImage} className="grid gap-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Photo</label>
            <input id="gallery-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" required />
            <p className="mt-2 text-xs text-neutral-500">Photos are automatically resized/compressed for the website.</p>
          </div>
          <div><label className="mb-2 block text-sm font-medium">Photo label</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2026 Charger after correction" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" /></div>
          <div><label className="mb-2 block text-sm font-medium">Where should this photo appear?</label><PlacementSelect value={category} onChange={setCategory} /><p className="mt-2 text-[11px] leading-4 text-neutral-500">Current destination: {placementByValue.get(category)?.label || category}</p></div>
          <div className="md:col-span-4"><button disabled={saving} className="rounded-xl bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] disabled:opacity-50">{saving ? "Processing photo…" : "Add Photo"}</button>{message && <span className="ml-4 text-sm text-neutral-300">{message}</span>}</div>
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-2"><button onClick={() => setFilter("all")} className={`rounded-full px-4 py-2 text-xs ${filter === "all" ? "bg-[#FF2D2D] text-[#0D0D0D]" : "border border-white/10 text-white/55"}`}>All Photos</button>{groups.map((group) => <button key={group} onClick={() => setFilter(group)} className={`rounded-full px-4 py-2 text-xs ${filter === group ? "bg-[#FF2D2D] text-[#0D0D0D]" : "border border-white/10 text-white/55"}`}>{group}</button>)}</div>

        {loading ? <p className="py-12 text-neutral-400">Loading…</p> : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleImages.map((image) => {
              const placement = placementByValue.get(image.category);
              return <article key={image.id} className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
                <img src={image.url} alt={image.title} className="h-56 w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Current Placement</p><p className="mt-1 text-sm font-medium text-white">{placement?.label || image.category}</p></div>
                  <input defaultValue={image.title} onBlur={(e) => { if (e.target.value !== image.title) updateImage(image, { title: e.target.value }).catch(() => setMessage("Rename failed.")); }} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm" />
                  <PlacementSelect value={image.category} onChange={(value) => updateImage(image, { category: value }).catch(() => setMessage("Update failed."))} />
                  <button onClick={() => deleteImage(image.id)} className="w-full rounded-lg bg-red-900/70 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-900">Delete Photo</button>
                </div>
              </article>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
