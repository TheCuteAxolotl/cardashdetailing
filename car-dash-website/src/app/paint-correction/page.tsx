import PricingMediaStrip from "@/components/PricingMediaStrip";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import SitePhoto from "@/components/SitePhoto";

const levels = [
  ["1-step", "Paint enhancement", "Best for light swirls, haze, and a big gloss improvement without chasing deeper defects."],
  ["2-step", "Paint correction", "A heavier cutting step followed by refinement for more noticeable swirls, oxidation, water spots, and defects."],
  ["Inspection", "Advanced correction", "For deeper defects, sanding marks, heavy oxidation, or paint that needs a custom approach before we decide how far to go."],
] as const;

export default function PaintCorrectionPage() {
  return (
    <main className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-3 lg:py-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Paint correction</p><h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Make the paint look better before you protect it.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-black/52">Correction reduces swirls, haze, oxidation, water spots, and other correctable defects. We inspect the paint first and only go as far as it is safe to go.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/#specialty-prices" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">See current prices</a><a href="/quote" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-bold text-white">Get exact quote</a><a href="/#book" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Book</a></div></div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[380px]"><SitePhoto category="paint-correction-hero" fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <PricingMediaStrip category="paint-correction-results" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {levels.map(([tag, title, body]) => <article key={title} className="rounded-[24px] border border-black/10 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#FF2D2D]">{tag}</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{title}</h2><p className="mt-3 text-sm leading-6 text-black/48">{body}</p></article>)}
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#111] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">What it can improve</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Swirls, haze, oxidation, light scratches, water spots, and dull paint.</h2></div>
          <div><p className="text-sm leading-7 text-white/48">Some defects are too deep to safely polish out. Chips, deep scratches, failing clear coat, and certain paint damage may still remain. We would rather leave a deeper mark than remove too much clear coat trying to chase it.</p><a href="/ceramic-coatings" className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold">Ceramic protection after correction →</a></div>
        </div>
      </section>

      <RelatedServiceLinks currentPath="/paint-correction" />
    </main>
  );
}
