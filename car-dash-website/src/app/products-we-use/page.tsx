import SitePhoto from "@/components/SitePhoto";
import PricingMediaStrip from "@/components/PricingMediaStrip";

const productGroups = [
  ["Interior", "Koch-Chemie Pol Star", "A gentle interior cleaner for surfaces that do not need anything overly aggressive."],
  ["Exterior cleaning", "Koch-Chemie Green Star", "A stronger cleaner for exterior pre-cleaning and dirtier areas when needed."],
  ["Wash chemistry", "Koch-Chemie Gentle Snow Foam", "Foam and wash soap for maintenance washes and safe contact washing."],
  ["Wheels", "Koch-Chemie Magic Wheel Cleaner", "A dedicated wheel cleaner for brake dust, road grime, and contamination."],
  ["Paint correction", "Koch-Chemie polishing system", "Compounds, polishes, and pads matched to the paint instead of one setup for every car."],
  ["Protection", "GYEON + Gtechniq", "Ceramic coatings and protection products selected for the package and surface."],
] as const;

export default function ProductsWeUsePage() {
  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <section className="border-b border-black/8">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-5 lg:py-10">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Products we use</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[.93] tracking-[-.06em] sm:text-6xl">The products behind the detail.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-black/52">Koch-Chemie is one of our main lines, along with GYEON, Gtechniq, and other products when the job calls for them.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/#prices" className="rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white">See prices</a>
              <a href="/#book" className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-white">Book now</a>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[390px]">
            <SitePhoto category="products-hero" fallbackCategory="home-showcase-secondary" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">What we reach for</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Different surfaces get different products.</h2>
            <p className="mt-4 text-sm leading-7 text-black/50">We choose the cleaner, dilution, pad, brush, polish, and protection for the surface in front of us instead of using one thing on everything.</p>
          </div>
          <div className="overflow-hidden rounded-[26px] border border-black/10">
            {productGroups.map(([category, name, body], index) => (
              <article key={name} className={`grid gap-2 bg-white px-5 py-5 sm:grid-cols-[.55fr_.85fr_1.6fr] sm:items-center sm:px-6 ${index ? "border-t border-black/8" : ""}`}>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6EAEC6]">{category}</p>
                <h3 className="text-base font-semibold">{name}</h3>
                <p className="text-sm leading-6 text-black/48">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0B1822] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <PricingMediaStrip category="products-gallery" theme="dark" />
          <p className="mt-6 max-w-4xl text-xs leading-6 text-white/35">Brand names are shown so customers can see the type of professional products used during service. Product selection can change as vehicle needs and professional product lines evolve. Car Dash Detailing does not imply sponsorship or endorsement by the brands listed.</p>
        </div>
      </section>
    </div>
  );
}
