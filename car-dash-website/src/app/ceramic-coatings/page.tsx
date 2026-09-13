import SitePhoto from "@/components/SitePhoto";
import PricingMediaStrip from "@/components/PricingMediaStrip";

const systems = [
  {
    name: "GYEON Synchro",
    tag: "Layered ceramic system",
    body: "A layered coating system we use for strong gloss, slickness, chemical resistance, and water behavior. The paint gets cleaned, decontaminated, and corrected as needed before the coating goes on.",
  },
  {
    name: "Gtechniq",
    tag: "Professional ceramic protection",
    body: "Gtechniq gives us several durable coating options depending on the vehicle and how much protection you want. We match the system to the job instead of using the same coating on everything.",
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
            <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">Ceramic coating starts with the prep.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">We use GYEON and Gtechniq coatings. Before any coating goes on, the paint gets cleaned, decontaminated, and corrected as needed.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/services" className="rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D]">View ceramic coating</a><a href="/quote" className="rounded-full border border-white/15 bg-white/[.025] px-6 py-3.5 text-sm font-semibold">Ask us about your vehicle</a></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Systems Car Dash uses</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">We use GYEON and Gtechniq coating systems.</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            {systems.map((system) => <article key={system.name} className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#FF2D2D]">{system.tag}</p><h3 className="mt-5 text-3xl font-semibold tracking-[-.04em]">{system.name}</h3><p className="mt-5 text-sm leading-7 text-white/48">{system.body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111318]">
        <div className="mx-auto grid max-w-[1540px] gap-px border-x border-white/10 bg-white/10 md:grid-cols-4">
          {[
            ["01", "Inspect", "We check the paint condition, defects, contamination, and how much correction makes sense first."],
            ["02", "Prepare", "We wash and decontaminate the paint so polishing and coating start with a clean surface."],
            ["03", "Correct", "We correct the paint as needed before the coating goes on."],
            ["04", "Coat", "The ceramic coating is applied and given the proper time to cure."],
          ].map(([number, title, body]) => <div key={number} className="bg-[#111318] p-7 sm:p-8"><p className="text-xs font-semibold text-[#FF2D2D]">{number}</p><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/42">{body}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10"><PricingMediaStrip category="ceramic-results" /></section>

      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-10 border-x border-black/10 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-10">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">What ceramic coating does</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">More protection, easier washing, and better water behavior.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-black/58"><p>Ceramic coating adds a durable layer of protection over the paint. It can add gloss, improve water behavior and chemical resistance, and make normal washing easier.</p><p>It does not make the paint scratch-proof, and you still need to wash it correctly. Good prep before coating and proper maintenance afterward are what keep it looking its best.</p><a href="/products-we-use" className="inline-flex rounded-full bg-[#0D0D0D] px-5 py-3 font-semibold text-white">See the products we use →</a></div>
        </div>
      </section>
    </div>
  );
}
