import Link from "next/link";
import DynamicGallery from "@/components/DynamicGallery";
import HeroImage from "@/components/HeroImage";
import ServiceCards from "@/components/ServiceCards";

export default function Home() {
  return (
    <div className="bg-[#070707] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.20),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(127,29,29,0.14),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-red-400">
              Mobile detailing • South Elgin
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Your car should look way better than just <span className="text-red-500">“clean.”</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">
              I bring the detail to you and take care of the interior, exterior, paint, and protection without making the process complicated. Pick what you need, book it, and I’ll handle the rest.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-red-600 px-7 py-3.5 text-sm font-black text-white transition hover:bg-red-500">
                Book Your Detail
              </Link>
              <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/10">
                See Packages
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-center">
              {[
                ["Mobile", "I come to you"],
                ["Straightforward", "No weird upsell"],
                ["Protected", "Real detailing care"],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-neutral-500">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <HeroImage />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Services</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Pick the package that makes sense for your car.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-neutral-400">
            These packages are controlled from my owner dashboard. When I change a price, add a package, or remove one, this section updates with it.
          </p>
        </div>
        <ServiceCards limit={3} />
        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:border-red-500/60 hover:text-red-400">
            View All Services
          </Link>
        </div>
      </section>

      <section id="gallery" className="bg-[#f4f1eb] text-black">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-700">Recent Work</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">The results speak for themselves.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-neutral-600">
              Real vehicles, real details. I upload new work from the owner dashboard so you can see what Car Dash is actually doing.
            </p>
          </div>
          <DynamicGallery limit={6} />
          <div className="mt-8">
            <Link href="/gallery" className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-red-600">
              See Full Gallery
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-red-500/25 bg-gradient-to-br from-[#171717] via-[#101010] to-[#280808] p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Ready?</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Send me your car and what you want done.</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                Tell me the year, make, model, condition, and the package you’re looking at. I’ll review it and get back to you with the next step.
              </p>
            </div>
            <Link href="/contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-600 px-7 py-4 text-sm font-black text-white transition hover:bg-red-500">
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
