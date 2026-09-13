import SitePhoto from "@/components/SitePhoto";
import PricingMediaStrip from "@/components/PricingMediaStrip";

const productGroups = [
  ["Interior", "Koch-Chemie Pol Star", "A gentle interior cleaner we use on surfaces that do not need anything overly aggressive."],
  ["Exterior cleaning", "Koch-Chemie Green Star", "A stronger cleaner we use for exterior pre-cleaning and dirtier areas when needed."],
  ["Wash chemistry", "Koch-Chemie Gentle Snow Foam", "Our foam and wash soap for maintenance washes and safe contact washing."],
  ["Wheels", "Koch-Chemie Magic Wheel Cleaner", "A dedicated wheel cleaner for brake dust, road grime, and contamination."],
  ["Paint correction", "Koch-Chemie polishing system", "We match compounds, polishes, and pads to the paint instead of using one combination on every car."],
  ["Protection", "GYEON + Gtechniq", "Ceramic coatings and protection products picked for the package and the surface we are working on."],
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
            <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">These are the products we actually use.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">Koch-Chemie is one of our main product lines, along with GYEON, Gtechniq, and other correction and protection products when a job needs them.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">What we use</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Different surfaces need different products.</h2><p className="mt-5 text-sm leading-7 text-white/45">We do not use the strongest chemical just because we can. The product, dilution, brush, pad, and process change depending on the surface and how dirty it is.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {productGroups.map(([category, name, body]) => <article key={name} className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-6"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#FF2D2D]">{category}</p><h3 className="mt-4 text-xl font-semibold">{name}</h3><p className="mt-3 text-sm leading-6 text-white/45">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10"><PricingMediaStrip category="products-gallery" /></section>

      <section className="bg-white text-[#0D0D0D]">
        <div className="mx-auto grid max-w-[1540px] gap-8 border-x border-black/10 px-5 py-20 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[
            ["Clean the right way", "Interior materials, wheels, trim, paint, and boat surfaces all need different cleaners and methods."],
            ["Match the paint", "Pads, polish, and machine choice change with the paint instead of forcing the same correction setup on every vehicle."],
            ["Use the right protection", "We pick protection based on the surface, how you plan to maintain it, and how long you want it to last."],
          ].map(([title, body]) => <article key={title} className="rounded-[24px] border border-black/10 p-6"><div className="h-1 w-10 rounded-full bg-[#FF2D2D]" /><h3 className="mt-5 text-2xl font-semibold tracking-[-.03em]">{title}</h3><p className="mt-3 text-sm leading-7 text-black/55">{body}</p></article>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#FF2D2D]/18 bg-[#FF2D2D]/[.045] p-6 sm:p-8"><p className="text-sm leading-7 text-white/48">Brand names are shown so customers can see the type of professional products used during service. Product selection can change as techniques, vehicle needs, and professional product lines evolve. Car Dash Detailing does not imply sponsorship or endorsement by the brands listed.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/ceramic-coatings" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Learn about ceramic coatings</a><a href="/services" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">View services</a></div></div>
      </section>
    </div>
  );
}
