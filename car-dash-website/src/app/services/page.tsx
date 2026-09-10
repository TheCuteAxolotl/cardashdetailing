import ServiceCards from "@/components/ServiceCards";
import SitePhoto from "@/components/SitePhoto";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <section className="mx-auto max-w-[1480px] px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-red-500/85">Services</p>
            <h1 className="mt-5 text-5xl font-medium leading-[.95] tracking-[-0.055em] sm:text-7xl">Packages built around what the vehicle needs.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/45">One clear price per package. Any extra work is discussed before it is added.</p>
            <a href="/contact" className="mt-7 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-semibold hover:bg-red-500">Get a Quote</a>
          </div>
          <div className="overflow-hidden rounded-[1.8rem]">
            <SitePhoto category="services-hero" className="h-[360px] w-full object-cover sm:h-[480px]" />
          </div>
        </div>
      </section>

      <main className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <ServiceCards variant="dark" />
          <div className="mt-10 border-t border-white/10 pt-7 text-sm leading-7 text-white/35">
            Heavy stains, excessive pet hair, major contamination, unusually large vehicles, or extra correction can require more work. Any added cost is confirmed before the job begins.
          </div>
        </div>
      </main>
    </div>
  );
}
