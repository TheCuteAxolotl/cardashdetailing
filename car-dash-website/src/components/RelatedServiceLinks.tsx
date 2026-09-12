const services = [
  { href: "/car-detailing-packages", title: "Full Detailing", body: "Interior + exterior packages for cars, SUVs, and trucks." },
  { href: "/interior-detailing", title: "Interior Detailing", body: "Vacuuming, surfaces, seats, carpets, stains, and interior resets." },
  { href: "/exterior-detailing", title: "Exterior Detailing", body: "Hand washing, wheels, decontamination, gloss, and protection." },
  { href: "/paint-correction", title: "Paint Correction", body: "Improve swirls, haze, oxidation, and other correctable paint defects." },
  { href: "/ceramic-coatings", title: "Ceramic Coatings", body: "Longer-term paint protection with proper preparation and coating care." },
  { href: "/marine-detailing", title: "Marine Detailing", body: "Interior, hull, oxidation, maintenance, and marine protection work." },
];

export default function RelatedServiceLinks({ currentPath }: { currentPath?: string }) {
  const visible = services.filter((service) => service.href !== currentPath);
  return (
    <section className="border-t border-white/8 bg-[#0a0a0a] px-5 py-14 text-white sm:px-8 lg:py-20">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.26em] text-[#FF2D2D]">Related services</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Compare the work your vehicle actually needs.</h2>
          </div>
          <a href="/quote" className="inline-flex w-fit rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D]">Get an Exact Quote</a>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((service) => (
            <a key={service.href} href={service.href} className="group rounded-[22px] border border-white/10 bg-white/[.025] p-5 transition hover:border-white/20 hover:bg-white/[.045]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold">{service.title}</h3>
                <span className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#FF2D2D]">→</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/42">{service.body}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
