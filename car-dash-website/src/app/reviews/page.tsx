import ReviewCards from "@/components/ReviewCards";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.17),transparent_35%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-18">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Reviews</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">What customers actually thought.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">Only reviews I approve from the Owner Dashboard show publicly here.</p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <ReviewCards />
      </main>
    </div>
  );
}
