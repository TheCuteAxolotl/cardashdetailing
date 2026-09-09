import DynamicGallery from "@/components/DynamicGallery";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="mx-auto max-w-7xl px-6 py-14">
        <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Gallery</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Real Car Dash Detailing work.</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">Photos uploaded from the owner dashboard appear here automatically.</p>
        <DynamicGallery />
      </main>
    </div>
  );
}
