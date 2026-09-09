import ServiceCards from "@/components/ServiceCards";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.18),transparent_32%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Car Dash Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Simple packages. One price. No three-column pricing mess.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            Every package below is created and priced by me from the owner dashboard. If I change something there, it changes here too.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
        <ServiceCards />
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm leading-7 text-neutral-400">
            Prices are starting prices unless I specifically list otherwise. Heavy stains, excessive pet hair, major contamination, or unusually large vehicles can require extra work. I’ll tell you before the job so there aren’t any surprises.
          </p>
        </div>
      </main>
    </div>
  );
}
