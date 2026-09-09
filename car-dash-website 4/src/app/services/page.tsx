import ServiceCards from "@/components/ServiceCards";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.2),transparent_30%),linear-gradient(to_bottom,#0b0b0b,#050505)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Choose the package that fits your car.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            I keep the pricing simple. Each package has one listed price that I control from the owner dashboard. No drop-off price, delivery price, and mobile price all fighting each other.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
        <ServiceCards />
        <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.035] p-7">
          <p className="text-sm leading-7 text-neutral-400">
            If the vehicle has something outside the normal package — heavy pet hair, major stains, excessive contamination, or another issue — I’ll tell you before the job. No surprise charge after I’m already there.
          </p>
        </div>
      </main>
    </div>
  );
}
