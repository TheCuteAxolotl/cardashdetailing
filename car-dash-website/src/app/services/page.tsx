import ServiceCards from "@/components/ServiceCards";
import PublicHero from "@/components/PublicHero";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PublicHero imageCategory="services-hero" eyebrowKey="servicesEyebrow" titleKey="servicesTitle" bodyKey="servicesBody" action={<a href="/contact" className="inline-flex rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold hover:bg-red-500">Book a detail</a>} />
      <main className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-[1540px] border-x border-white/10 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <ServiceCards variant="dark" />
          <div className="mt-12 rounded-[30px] border border-white/10 bg-white/[.03] p-7 sm:p-9">
            <p className="text-[10px] uppercase tracking-[.26em] text-red-400">Not sure which one?</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Send the vehicle condition and what you want fixed. The right package can be figured out from there.</h2>
              <a href="/contact" className="w-fit rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:border-white/30 hover:text-white">Send vehicle info</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
