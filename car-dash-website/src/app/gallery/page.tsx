import DynamicGallery from "@/components/DynamicGallery";
import PublicHero from "@/components/PublicHero";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <PublicHero imageCategory="gallery-hero" eyebrowKey="galleryEyebrow" titleKey="galleryTitle" bodyKey="galleryBody" action={<a href="/#book" className="inline-flex rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-white">Book now</a>} />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Recent work</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Before, after, and finished details.</h2></div>
          <a href="/#prices" className="text-sm font-semibold text-black/48">See prices →</a>
        </div>
        <DynamicGallery />
      </main>
    </div>
  );
}
