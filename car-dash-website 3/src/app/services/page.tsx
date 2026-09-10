import Link from "next/link";
import ServiceCards from "@/components/ServiceCards";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#f4f3f0] text-black">
      <section className="relative overflow-hidden bg-[#080808] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(220,38,38,.22),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Car Dash Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Pick your package. I’ll bring the detail to you.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300">
            One price per package. No separate mobile, delivery, or drop-off columns. What you see is what I’m currently offering.
          </p>
          <Link href="/contact" className="mt-8 inline-flex rounded-full bg-red-600 px-7 py-3.5 text-sm font-black text-white hover:bg-red-500">
            Get a Quote
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <ServiceCards variant="light" />
        <div className="mt-10 rounded-[1.7rem] border border-black/10 bg-white p-7 text-sm leading-7 text-neutral-600">
          Prices are based on the package shown. Heavy stains, excessive pet hair, major contamination, unusually large vehicles, or extra correction can require more work. If that applies to your vehicle, I’ll tell you before the job.
        </div>
      </main>
    </div>
  );
}
