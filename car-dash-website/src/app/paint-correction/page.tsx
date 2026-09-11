import SitePhoto from "@/components/SitePhoto";

const levels = [
  {
    label: "Paint Enhancement",
    title: "One-step refinement",
    body: "Best for paint that mainly needs more gloss and clarity. A one-step process targets light swirls, haze, wash marks, and mild oxidation while keeping the process efficient for daily-driven vehicles.",
  },
  {
    label: "Paint Correction",
    title: "Two-step correction",
    body: "A more aggressive cutting stage is followed by a refining polish. This is used when the paint has more visible swirls, oxidation, water spotting, or defects that a lighter enhancement cannot address effectively.",
  },
  {
    label: "Advanced Correction",
    title: "Multi-step / inspection-based",
    body: "Reserved for paint that needs more involved correction. Deeper defects, severe oxidation, previous sanding marks, or difficult finishes are inspected first so the safest correction plan can be chosen.",
  },
] as const;

export default function PaintCorrectionPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative isolate min-h-[620px] overflow-hidden border-b border-white/10">
        <SitePhoto category="paint-correction-hero" fallbackCategory="home-showcase-secondary" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,13,13,.97)_0%,rgba(13,13,13,.82)_50%,rgba(13,13,13,.42)_100%)]" />
        <div className="mx-auto flex min-h-[620px] max-w-[1540px] items-end border-x border-white/10 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Paint Correction Guide</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">Correct the finish before you protect it.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">Paint correction uses machine polishing to reduce defects and restore clarity. The right level depends on the paint, defect depth, finish goals, and how much clear coat can be safely worked.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/services#car-detailing" className="rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D]">View correction services</a><a href="/quote" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3.5 text-sm font-semibold">Ask about your paint</a></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Correction levels</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Not every vehicle needs the same amount of polishing.</h2>
            <p className="mt-5 text-sm leading-7 text-white/45">The goal is to improve the finish without chasing defects that are too deep to remove safely. Correction level is matched to the actual paint condition.</p>
          </div>
          <div className="grid gap-4">
            {levels.map((level, index) => <article key={level.title} className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-7 sm:grid sm:grid-cols-[96px_1fr] sm:gap-6"><div><p className="text-xs font-semibold text-[#FF2D2D]">0{index + 1}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">{level.label}</p></div><div><h3 className="text-2xl font-semibold tracking-[-.04em]">{level.title}</h3><p className="mt-4 text-sm leading-7 text-white/48">{level.body}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111318]">
        <div className="mx-auto grid max-w-[1540px] gap-px border-x border-white/10 bg-white/10 md:grid-cols-4">
          {[
            ["01", "Inspect", "Lighting and paint condition reveal swirls, oxidation, scratches, water spots, previous repair work, and realistic correction limits."],
            ["02", "Decontaminate", "The vehicle is thoroughly washed and decontaminated so bonded contamination is not dragged through the polishing process."],
            ["03", "Correct + refine", "Machine, pad, compound, and polish combinations are selected according to the paint and the defect level being targeted."],
            ["04", "Protect", "After correction, wax, sealant, or ceramic protection can be applied to help preserve the corrected finish."],
          ].map(([number, title, body]) => <div key={number} className="bg-[#111318] p-7 sm:p-8"><p className="text-xs font-semibold text-[#FF2D2D]">{number}</p><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/42">{body}</p></div>)}
        </div>
      </section>

      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-10 border-x border-black/10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">What correction can improve</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Clarity, gloss, and the defects that make paint look tired.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{["Swirl marks", "Light wash scratches", "Oxidation + haze", "Water spotting", "Light marring", "Loss of gloss"].map((item)=><div key={item} className="rounded-2xl border border-black/10 bg-[#F7F9FA] px-4 py-3 text-sm font-medium">{item}</div>)}</div>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-[#F7F9FA] p-7 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#4A5568]">Important limitation</p>
            <h3 className="mt-4 text-2xl font-semibold">Correction is improvement, not unlimited paint removal.</h3>
            <p className="mt-4 text-sm leading-7 text-black/58">Some scratches, chips, failing clear coat, and defects that are too deep cannot be safely polished away. Car Dash prioritizes the finish and the long-term health of the paint instead of chasing a defect past a safe correction point.</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="/products-we-use" className="rounded-full bg-[#0D0D0D] px-5 py-3 text-sm font-semibold text-white">Products we use</a><a href="/ceramic-coatings" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold">Protect corrected paint</a></div>
          </div>
        </div>
      </section>
    </div>
  );
}
