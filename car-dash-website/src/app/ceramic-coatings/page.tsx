import SitePhoto from "@/components/SitePhoto";
import PricingMediaStrip from "@/components/PricingMediaStrip";

const systems = [
  {
    name: "GYEON Synchro",
    tag: "Layered ceramic system",
    body: "A multi-layer coating approach used when the goal is strong gloss, slickness, chemical resistance, and hydrophobic behavior. The paint is properly cleaned and prepared before coating so the protection is bonding to a corrected surface instead of hiding contamination underneath it.",
  },
  {
    name: "Gtechniq",
    tag: "Professional ceramic protection",
    body: "Gtechniq coating systems are used for customers who want a durable, high-end protection option with strong water behavior and easier maintenance. The exact Gtechniq system is matched to the vehicle, desired protection level, and service package.",
  },
];

export default function CeramicCoatingsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative isolate min-h-[620px] overflow-hidden border-b border-white/10">
        <SitePhoto category="ceramic-coatings-hero" fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,13,13,.96)_0%,rgba(13,13,13,.78)_48%,rgba(13,13,13,.38)_100%)]" />
        <div className="mx-auto flex min-h-[620px] max-w-[1540px] items-end border-x border-white/10 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Protection Guide</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">Ceramic coatings, without the mystery.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">Car Dash uses professional coating systems from GYEON and Gtechniq. The coating is only one part of the result—the preparation underneath it matters just as much.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/services" className="rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D]">View coating services</a><a href="/quote" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3.5 text-sm font-semibold">Ask about your vehicle</a></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Systems Car Dash uses</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Two premium coating families. One focus: proper prep.</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            {systems.map((system) => <article key={system.name} className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#FF2D2D]">{system.tag}</p><h3 className="mt-5 text-3xl font-semibold tracking-[-.04em]">{system.name}</h3><p className="mt-5 text-sm leading-7 text-white/48">{system.body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111318]">
        <div className="mx-auto grid max-w-[1540px] gap-px border-x border-white/10 bg-white/10 md:grid-cols-4">
          {[
            ["01", "Inspect", "Paint condition, defects, contamination, and realistic correction goals are checked first."],
            ["02", "Prepare", "The surface is thoroughly cleaned and decontaminated so polishing and coating work start clean."],
            ["03", "Correct", "Paint correction is performed as needed before protection is locked in."],
            ["04", "Coat", "The selected ceramic system is applied and allowed to cure according to the service plan."],
          ].map(([number, title, body]) => <div key={number} className="bg-[#111318] p-7 sm:p-8"><p className="text-xs font-semibold text-[#FF2D2D]">{number}</p><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/42">{body}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10"><PricingMediaStrip category="ceramic-results" /></section>

      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-10 border-x border-black/10 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-10">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">What ceramic coating does</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Protection that makes a properly finished vehicle easier to maintain.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-black/58"><p>Ceramic coating adds a durable protective layer over properly prepared paint. It can improve gloss, water behavior, chemical resistance, and make routine washing easier.</p><p>It does not make paint scratch-proof or eliminate the need for safe washing. The best results come from correct prep, realistic expectations, and proper maintenance after installation.</p><a href="/products-we-use" className="inline-flex rounded-full bg-[#0D0D0D] px-5 py-3 font-semibold text-white">See the products we use →</a></div>
        </div>
      </section>
    </div>
  );
}
