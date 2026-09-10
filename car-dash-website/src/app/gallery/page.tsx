import DynamicGallery from "@/components/DynamicGallery";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">Gallery</p>
        <h1 className="mt-5 max-w-5xl text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Real vehicles. Real Car Dash work.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/42">New work added from the Owner Dashboard appears here automatically.</p>
      </section>
      <main className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12"><DynamicGallery /></div>
      </main>
    </div>
  );
}
