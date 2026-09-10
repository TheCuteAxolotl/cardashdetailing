import DynamicGallery from "@/components/DynamicGallery";
import PublicHero from "@/components/PublicHero";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PublicHero imageCategory="gallery-hero" eyebrowKey="galleryEyebrow" titleKey="galleryTitle" bodyKey="galleryBody" />
      <main className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <DynamicGallery />
      </main>
    </div>
  );
}
