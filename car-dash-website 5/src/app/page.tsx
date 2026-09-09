import Link from "next/link";
import DynamicGallery from "@/components/DynamicGallery";
import HeroImage from "@/components/HeroImage";
import ServiceCards from "@/components/ServiceCards";

const perks = [
  ["Fully mobile", "I come to you, so you don't have to waste time sitting at a shop."],
  ["Straight pricing", "Pick the package you want. If something needs extra work, I tell you first."],
  ["Built around your car", "Every vehicle is different, so I focus on what will actually make yours look better."],
];

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#050505] text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-red-700/20 blur-[120px]" />
          <div className="absolute right-[-14rem] top-[8rem] h-[34rem] w-[34rem] rounded-full bg-red-950/30 blur-[140px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-red-400">
              South Elgin • Mobile Detailing
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-6xl lg:text-[5rem]">
              I bring the detail <span className="text-red-500">to you.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">
              Interior, exterior, paint correction, and protection without the hassle of dropping your car off somewhere. You tell me what you want done, I come out, and I handle the rest.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-7 py-4 text-sm font-black text-white shadow-[0_12px_50px_rgba(220,38,38,.26)] transition hover:bg-red-500"
              >
                Book Your Detail
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-black text-white transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                View Services
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-neutral-400">
              <span>✓ Mobile service</span>
              <span>✓ Real photos</span>
              <span>✓ Straightforward booking</span>
            </div>
          </div>

          <HeroImage />
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#090909]">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
          {perks.map(([title, copy]) => (
            <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-4 h-1 w-10 rounded-full bg-red-600" />
              <h2 className="text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Packages</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Pick what you want done. I’ll take it from there.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-neutral-400">
            These are the packages I currently offer. I can add, remove, or update them from the owner dashboard, so what you see here is what I’m actually offering.
          </p>
        </div>

        <ServiceCards limit={3} />

        <div className="mt-9 flex justify-center">
          <Link
            href="/services"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-black transition hover:border-red-500/60 hover:text-red-400"
          >
            See All Services
          </Link>
        </div>
      </section>

      <section id="gallery" className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Recent Work</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
                See what I’ve actually worked on.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-neutral-400">
              I upload my own work here, so you can see the kind of results you can expect before you book.
            </p>
          </div>

          <DynamicGallery limit={6} />

          <div className="mt-9">
            <Link
              href="/gallery"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-red-600 hover:text-white"
            >
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-red-500/20 bg-[#101010] p-8 sm:p-12 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(220,38,38,.20),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Ready to book?</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
                Send me your vehicle and what you want done.
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300 sm:text-base">
                Give me the year, make, model, and the service you’re looking at. If the car needs anything extra, I’ll let you know before we lock anything in.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-600 px-8 py-4 text-sm font-black text-white transition hover:bg-red-500"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
