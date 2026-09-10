"use client";

import { useEffect, useState } from "react";

type ImageItem = { id: string; url: string; title: string; category: string };

async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const source = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export default function OwnerGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gallery");
  const [message, setMessage] = useState("");

  const fetchImages = async () => {
    const response = await fetch("/api/images", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch images");
    setImages(await response.json());
  };

  useEffect(() => {
    fetchImages().catch(() => setMessage("Could not load gallery." )).finally(() => setLoading(false));
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
      setCategory("gallery");
      const input = document.getElementById("gallery-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await fetchImages();
      setMessage("Photo added successfully.");
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div><h1 className="text-2xl font-bold">Website Photos</h1><p className="text-sm text-neutral-400">Upload photos and choose exactly where they appear across the website.</p></div>
          <a href="/owner/dashboard" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium hover:bg-red-800">Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <form onSubmit={addImage} className="grid gap-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Photo</label>
            <input id="gallery-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" required />
            <p className="mt-2 text-xs text-neutral-500">Photos are automatically resized/compressed for the website.</p>
          </div>
          <div><label className="mb-2 block text-sm font-medium">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2026 Charger ceramic coating" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm" /></div>
          <div><label className="mb-2 block text-sm font-medium">Placement</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"><option value="gallery">Public Gallery</option><option value="before-after">Before & After</option><option value="portfolio">Portfolio</option><option value="hero">Homepage Hero</option><option value="home-showcase-primary">Homepage Showcase — Large</option><option value="home-showcase-secondary">Homepage Showcase — Small</option><option value="home-story">Homepage Story</option><option value="services-hero">Services Page Hero</option><option value="reviews-hero">Reviews Page Hero</option><option value="contact-hero">Contact Page Hero</option></select></div>
          <div className="md:col-span-4"><button disabled={saving} className="rounded-xl bg-red-700 px-6 py-3 font-semibold hover:bg-red-800 disabled:opacity-50">{saving ? "Processing photo…" : "Add Photo"}</button>{message && <span className="ml-4 text-sm text-neutral-300">{message}</span>}</div>
        </form>

        {loading ? <p className="py-12 text-neutral-400">Loading…</p> : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
                <img src={image.url} alt={image.title} className="h-56 w-full object-cover" />
                <div className="space-y-3 p-4">
                  <input defaultValue={image.title} onBlur={(e) => { if (e.target.value !== image.title) updateImage(image, { title: e.target.value }).catch(() => setMessage("Rename failed.")); }} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm" />
                  <select value={image.category} onChange={(e) => updateImage(image, { category: e.target.value }).catch(() => setMessage("Update failed."))} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"><option value="gallery">Public Gallery</option><option value="before-after">Before & After</option><option value="portfolio">Portfolio</option><option value="hero">Homepage Hero</option><option value="home-showcase-primary">Homepage Showcase — Large</option><option value="home-showcase-secondary">Homepage Showcase — Small</option><option value="home-story">Homepage Story</option><option value="services-hero">Services Page Hero</option><option value="reviews-hero">Reviews Page Hero</option><option value="contact-hero">Contact Page Hero</option></select>
                  <button onClick={() => deleteImage(image.id)} className="w-full rounded-lg bg-red-800 px-3 py-2 text-sm font-medium hover:bg-red-900">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
