import DynamicGallery from "@/components/DynamicGallery";
import SitePhoto from "@/components/SitePhoto";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:px-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-400/80">Gallery</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Recent work. No stock photos needed.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/40">The gallery updates from the Owner Dashboard, so the work shown here can stay current.</p>
        </div>
        <div className="overflow-hidden rounded-[1.8rem]"><SitePhoto category="gallery-hero" className="h-[340px] w-full object-cover sm:h-[480px]" /></div>
      </section>
      <main className="border-t border-white/8 bg-[#0a0a0a]"><div className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12"><DynamicGallery /></div></main>
    </div>
  );
}
