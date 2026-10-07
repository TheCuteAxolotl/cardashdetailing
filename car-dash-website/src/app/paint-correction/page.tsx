import PricingMediaStrip from "@/components/PricingMediaStrip";
import SitePhoto from "@/components/SitePhoto";

const levels = [
  ["1-step", "Paint enhancement", "Best when you’ve got light swirls or haze and want a noticeable jump in gloss without chasing every deeper defect."],
  ["2-step", "Paint correction", "A stronger correction step followed by refinement for heavier swirls, oxidation, water spots, and other defects."],
  ["Inspection", "Advanced correction", "For deeper defects, sanding marks, heavy oxidation, or paint we need to inspect before deciding how far to go."],
] as const;

export default function PaintCorrectionPage() {
  return (
    <main className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <section className="border-b border-black/8 bg-[#f5f4f1] sm:px-5 lg:px-8">
        <div className="public-hero-shell mx-auto grid max-w-[1440px] gap-7 overflow-hidden bg-white px-5 py-10 sm:my-5 sm:px-8 sm:py-14 lg:my-7 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch lg:px-10">
          <div className="flex flex-col justify-center py-3 lg:py-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Paint correction</p><h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Make the paint look better before you protect it.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-black/52">Paint correction can cut down swirls, haze, oxidation, water spots, and other defects. We check the paint first and only go as far as it’s safe to go.</p><div className="mt-5 flex flex-wrap gap-3"><a href="#correction-levels" className="rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white">See correction levels</a><a href="/quote?service=paint-correction" className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-white">Get exact quote</a><a href="/#book" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Book</a></div></div>
          <div className="public-hero-media relative min-h-[320px] overflow-hidden bg-black sm:min-h-[420px]"><SitePhoto category="paint-correction-hero" fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" /></div>
        </div>
      </section>

      <section id="correction-levels" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
        <PricingMediaStrip category="paint-correction-results" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {levels.map(([tag, title, body]) => <article key={title} className="rounded-[24px] border border-black/10 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6EAEC6]">{tag}</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{title}</h2><p className="mt-3 text-sm leading-6 text-black/48">{body}</p></article>)}
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#111] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">What it can improve</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Swirls, haze, oxidation, light scratches, water spots, and dull paint.</h2></div>
          <div><p className="text-sm leading-7 text-white/48">Some defects are just too deep to safely polish out. Chips, deep scratches, failing clear coat, and certain paint damage can still remain. We’d rather leave a deeper mark than remove too much clear coat trying to chase it.</p><a href="/ceramic-coatings" className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold">Ceramic protection after correction →</a></div>
        </div>
      </section>

    </main>
  );
}
