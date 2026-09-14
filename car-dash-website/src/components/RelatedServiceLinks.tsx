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
    <section className="border-t border-black/8 bg-[#F4F3EF] px-5 py-10 text-[#111] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">More services</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Need something else?</h2></div>
          <div className="flex flex-wrap gap-2">
            <a href="/#prices" className="rounded-full bg-[#111] px-4 py-2.5 text-sm font-semibold text-white">All prices</a>
            <a href="/#book" className="rounded-full bg-[#FF2D2D] px-4 py-2.5 text-sm font-semibold text-white">Book</a>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {visible.map((service) => <a key={service.href} href={service.href} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/62 hover:text-black">{service.title}</a>)}
        </div>
      </div>
    </section>
  );
}
