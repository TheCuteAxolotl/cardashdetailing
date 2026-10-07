const services = [
  { href: "/car-detailing-packages", title: "Full Detailing" },
  { href: "/interior-detailing", title: "Interior" },
  { href: "/exterior-detailing", title: "Exterior" },
  { href: "/paint-correction", title: "Paint Correction" },
  { href: "/ceramic-coatings", title: "Ceramic Coating" },
  { href: "/marine-detailing", title: "Marine" },
];

export default function RelatedServiceLinks({ currentPath }: { currentPath?: string }) {
  const visible = services.filter((service) => service.href !== currentPath);
  return (
    <section className="border-t border-black/8 bg-[#f5f4f1] px-5 py-14 text-[#111] sm:px-8 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-black/36">More services</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Need something else?</h2></div>
          <div className="flex flex-wrap gap-2">
            <a href="/#prices" className="rounded-full bg-[#111] px-4 py-2.5 text-sm font-semibold text-white">All prices</a>
            <a href="/#book" className="rounded-full bg-[#6EAEC6] px-4 py-2.5 text-sm font-semibold text-white">Book</a>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {visible.map((service) => <a key={service.href} href={service.href} className="related-service-link rounded-full border border-black/[.08] bg-white px-4 py-2.5 text-sm font-medium text-black/58 shadow-[0_6px_20px_rgba(23,20,17,.025)] hover:border-black/18 hover:text-black">{service.title}</a>)}
        </div>
      </div>
    </section>
  );
}
