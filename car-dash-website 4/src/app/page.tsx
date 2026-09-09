import Link from "next/link";
import DynamicGallery from "@/components/DynamicGallery";
import HeroImage from "@/components/HeroImage";
import ServiceCards from "@/components/ServiceCards";

export default function Home() {
  return (
    <div className="bg-[#050505] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,.22),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,.06),transparent_25%),linear-gradient(to_bottom,#090909,#050505)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-red-400">
              Mobile detailing • South Elgin
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              I bring the detail to you. <span className="text-red-500">You enjoy the result.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">
              Interior, exterior, paint enhancement, protection, and full details without making you drop your whole day at a shop. Tell me what your car needs and I’ll take care of it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-red-600 px-7 py-3.5 text-sm font-black text-white transition hover:bg-red-500">
                Book Now
              </Link>
              <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white transition hover:border-red-500/40 hover:bg-white/[0.07]">
                View Services
              </Link>
            </div>
          </div>
          <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_30px_100px_rgba(0,0,0,.55)]">
            <HeroImage />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Services</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Pick what you want done. I’ll handle the rest.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-neutral-400">
            Every package here is controlled from my owner dashboard, so the price and details you see are the current ones.
          </p>
        </div>
        <ServiceCards limit={3} />
        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:border-red-500/60 hover:text-red-400">
            See All Packages
          </Link>
        </div>
      </section>

      <section id="gallery" className="border-y border-white/10 bg-[#0a0a0a] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Recent Work</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">This is what the work looks like.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-neutral-400">
              These are actual photos I upload from the owner dashboard, so you can see the kind of work I’m putting out.
            </p>
          </div>
          <DynamicGallery limit={6} />
          <div className="mt-8">
            <Link href="/gallery" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-red-600 hover:text-white">
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[34px] border border-red-500/25 bg-[linear-gradient(135deg,#171717_0%,#0a0a0a_55%,#2a0606_100%)] p-8 sm:p-12">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Ready to book?</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Send me the car and what you want done.</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                Year, make, model, condition, and the package you want. I’ll look it over and get back to you.
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
