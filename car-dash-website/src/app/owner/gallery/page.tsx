"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Image {
  id: string;
  url: string;
  title: string;
  category: string;
}

export default function OwnerGallery() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    category: "gallery",
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add image");
      await fetchImages();
      setFormData({ url: "", title: "", category: "gallery" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding image:", error);
      alert("Failed to add image");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete image");
      await fetchImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Gallery</h1>
            <p className="text-sm text-neutral-400">Add and remove gallery images</p>
          </div>
          <Link href="/owner/dashboard" className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium">
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Add Image Form */}
        {showForm ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Image</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                  placeholder="Image Title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                >
                  <option value="gallery">Gallery</option>
                  <option value="before-after">Before & After</option>
                  <option value="portfolio">Portfolio</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 transition font-medium"
                >
                  Add Image
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 px-6 py-3 rounded-lg bg-red-700 hover:bg-red-800 transition font-medium"
          >
            + Add New Image
          </button>
        )}

        {/* Images Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="rounded-3xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-1">{image.title}</h3>
                <p className="text-xs text-neutral-400 mb-3">{image.category}</p>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="w-full px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No images yet. Add one to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}
