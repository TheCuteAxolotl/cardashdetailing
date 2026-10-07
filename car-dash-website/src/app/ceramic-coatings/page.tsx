import PricingMediaStrip from "@/components/PricingMediaStrip";
import SitePhoto from "@/components/SitePhoto";

const coatingPackages = [
  {
    id: "3-year",
    eyebrow: "3-year protection",
    name: "GYEON Mohs",
    description: "A solid long-term coating if you want more gloss, easier washing, and strong chemical and water resistance.",
    prices: { sedan: 499, suv: 649, truck: 699 },
    imageCategory: "ceramic-3-year",
    featured: false,
    features: [
      "Full exterior detail",
      "Chemical decontamination and clay treatment as needed",
      "Dedicated coating prep and panel wipe",
      "GYEON Mohs ceramic coating",
      "Final coating inspection and care guidance",
    ],
  },
  {
    id: "5-year",
    eyebrow: "5-year protection",
    name: "Gtechniq CSL + EXO v5",
    description: "For cars that need more paint correction first. We sharpen up the finish, then lock it in with long-term ceramic protection.",
    prices: { sedan: 699, suv: 849, truck: 899 },
    imageCategory: "ceramic-5-year",
    featured: true,
    features: [
      "Full exterior detail",
      "Chemical and mechanical decontamination",
      "2-step paint correction",
      "Gtechniq Crystal Serum Light base coating",
      "Gtechniq EXO v5 top coating",
      "Final coating inspection and care guidance",
    ],
  },
  {
    id: "8-year",
    eyebrow: "8+ year protection",
    name: "Gtechniq Crystal Serum Ultra",
    description: "Our highest-level coating package. It uses Crystal Serum Ultra and includes a maintenance-backed long-term protection plan.",
    prices: { sedan: 999, suv: 1149, truck: 1199 },
    imageCategory: "ceramic-8-year",
    featured: false,
    features: [
      "Full exterior detail",
      "Chemical and mechanical decontamination",
      "2-step paint correction",
      "Finish refinement based on paint inspection",
      "Gtechniq Crystal Serum Ultra",
      "Final coating inspection and care guidance",
      "Car Dash 8+ year guarantee with active maintenance program",
    ],
  },
] as const;

const priceRows = [
  ["Sedan", "sedan"],
  ["SUV/CRV", "suv"],
  ["Truck/3 Row SUV", "truck"],
] as const;

export default function CeramicCoatingsPage() {
  return (
    <main className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-3 lg:py-8">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Ceramic coating</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Protection starts with the paint underneath.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/52">Every coating package starts with a full exterior detail and proper prep. Higher levels add more paint correction and longer-lasting protection.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#coating-packages" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">See packages</a>
              <a href="/quote?service=ceramic-coating" className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-white">Get exact quote</a>
              <a href="/#book" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Book</a>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[380px]">
            <SitePhoto category="ceramic-coatings-hero" fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section id="coating-packages" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">Ceramic packages</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Pick the protection level that makes sense for your car.</h2>
          <p className="mt-4 text-sm leading-7 text-black/52">These are starting prices. Paint condition, vehicle size, old coatings, oxidation, sanding, or extra correction can change the final quote. We’ll confirm that with you before we start.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {coatingPackages.map((pkg) => (
            <article key={pkg.id} className={`overflow-hidden rounded-[28px] border ${pkg.featured ? "border-[#6EAEC6]/45 bg-white shadow-[0_22px_60px_rgba(0,0,0,.08)]" : "border-black/10 bg-white"}`}>
              <div className="relative h-52 overflow-hidden bg-black">
                <SitePhoto category={pkg.imageCategory} fallbackCategory="ceramic-coatings-hero" className="absolute inset-0 h-full w-full object-cover" alt={pkg.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/65">{pkg.eyebrow}</p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-[-.035em]">{pkg.name}</h3>
                  </div>
                  {pkg.featured && <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#111]">Most popular</span>}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="min-h-20 text-sm leading-6 text-black/52">{pkg.description}</p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-[#F7F7F5]">
                  {priceRows.map(([label, key], index) => (
                    <div key={key} className={`flex items-center justify-between gap-4 px-4 py-3.5 ${index ? "border-t border-black/8" : ""}`}>
                      <span className="text-sm font-medium text-black/58">{label}</span>
                      <strong className="text-base">Starting ${pkg.prices[key]}</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-2">
                  {pkg.features.map((feature) => (
                    <p key={feature} className="flex gap-3 text-sm leading-6 text-black/58">
                      <span className="mt-0.5 text-[#6EAEC6]">✓</span>
                      <span>{feature}</span>
                    </p>
                  ))}
                </div>

                <a href={`/quote?service=${encodeURIComponent(pkg.name)}`} className="mt-6 inline-flex w-full justify-center rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">Get exact quote</a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-black/10 bg-[#111] p-6 text-white sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6EAEC6]">About the 8+ year guarantee</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-white/55">The 8+ year guarantee is a Car Dash maintenance-backed program tied to the Crystal Serum Ultra package. The vehicle must remain enrolled in the required maintenance program and follow the care requirements provided at delivery. We confirm the program terms before the coating is installed.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16">
        <PricingMediaStrip category="ceramic-results" />
      </section>

      <section className="border-y border-black/8 bg-[#111] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">What ceramic coating does</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">More gloss, easier maintenance, stronger chemical resistance, and long-term paint protection.</h2>
          </div>
          <div>
            <p className="text-sm leading-7 text-white/48">A ceramic coating won’t make the paint scratch-proof, and you’ll still need to wash the car. The finish underneath matters, which is why we handle correction and prep before the coating goes on.</p>
            <a href="/paint-correction" className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold">Learn about paint correction →</a>
          </div>
        </div>
      </section>
    </main>
  );
}
