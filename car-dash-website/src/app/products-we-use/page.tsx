import SitePhoto from "@/components/SitePhoto";

const productGroups = [
  ["Interior", "Koch-Chemie Pol Star", "A gentle professional cleaner used for interior surfaces where controlled cleaning matters."],
  ["Exterior cleaning", "Koch-Chemie Green Star", "A versatile alkaline cleaner used when stronger exterior cleaning or pre-cleaning is needed."],
  ["Wash chemistry", "Koch-Chemie Gentle Snow Foam", "Foam and wash chemistry for controlled contact washing and maintenance work."],
  ["Wheels", "Koch-Chemie Magic Wheel Cleaner", "A dedicated wheel cleaner for brake dust and road contamination."],
  ["Paint correction", "Koch-Chemie polishing system", "Compounds and polishes are matched to paint condition, pad choice, and the level of correction being targeted."],
  ["Protection", "GYEON + Gtechniq", "Ceramic and protection products selected according to the package and the surface being protected."],
] as const;

export default function ProductsWeUsePage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="relative isolate min-h-[620px] overflow-hidden border-b border-white/10">
        <SitePhoto category="products-hero" fallbackCategory="home-showcase-secondary" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,13,13,.97)_0%,rgba(13,13,13,.8)_50%,rgba(13,13,13,.42)_100%)]" />
        <div className="mx-auto flex min-h-[620px] max-w-[1540px] items-end border-x border-white/10 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#FF2D2D]">Products We Use</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">Professional chemistry. Chosen for the job, not the label.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">Koch-Chemie is a core part of the Car Dash detailing setup, supported by specialized correction and protection products when the vehicle needs something more specific.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Koch-Chemie led</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Different surfaces need different chemistry.</h2><p className="mt-5 text-sm leading-7 text-white/45">The goal is not to use the strongest chemical possible. It is to use the right product, dilution, tool, and process for the surface and contamination in front of us.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {productGroups.map(([category, name, body]) => <article key={name} className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-6"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#FF2D2D]">{category}</p><h3 className="mt-4 text-xl font-semibold">{name}</h3><p className="mt-3 text-sm leading-6 text-white/45">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-8 border-x border-black/10 px-5 py-20 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[
            ["Clean safely", "Interior materials, wheels, trim, paint, and marine surfaces do not all tolerate the same chemistry."],
            ["Correct efficiently", "Pad, polish, machine, and paint combination are adjusted instead of forcing one correction process onto every vehicle."],
            ["Protect intentionally", "Protection is selected based on the surface, expected maintenance, and the customer's goals."],
          ].map(([title, body]) => <article key={title} className="rounded-[24px] border border-black/10 p-6"><div className="h-1 w-10 rounded-full bg-[#FF2D2D]" /><h3 className="mt-5 text-2xl font-semibold tracking-[-.03em]">{title}</h3><p className="mt-3 text-sm leading-7 text-black/55">{body}</p></article>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#FF2D2D]/18 bg-[#FF2D2D]/[.045] p-6 sm:p-8"><p className="text-sm leading-7 text-white/48">Brand names are shown so customers can see the type of professional products used during service. Product selection can change as techniques, vehicle needs, and professional product lines evolve. Car Dash Detailing does not imply sponsorship or endorsement by the brands listed.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/ceramic-coatings" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Learn about ceramic coatings</a><a href="/services" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">View services</a></div></div>
      </section>
    </div>
  );
}
