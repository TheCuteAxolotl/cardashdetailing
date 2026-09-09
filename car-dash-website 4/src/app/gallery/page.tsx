import DynamicGallery from "@/components/DynamicGallery";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-black">
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-18">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-700">Gallery</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Real cars I’ve worked on.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600">No stock photos. When I add new work through the Owner Dashboard, it shows up here automatically.</p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <DynamicGallery />
      </main>
    </div>
  );
}
