import DynamicGallery from "@/components/DynamicGallery";
import HeroImage from "@/components/HeroImage";
import Link from "next/link";

const highlights = [
  ["Mobile service", "I come to you, so you don't have to lose half your day dropping the car off."],
  ["Real protection", "I use products and processes I trust on my own cars—not whatever is cheapest."],
  ["No rushed work", "Every car gets the time it actually needs. I'd rather do it right than rush it out."],
];

export default function Home() {
  return (
    <div className="bg-[#070707] text-white">
      <section className="brand-grid border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ef233c]/35 bg-[#ef233c]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#ff5a6d]">
              South Elgin • Mobile Detailing
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-7xl">
              Your car should look <span className="text-[#ef233c]">way better</span> than just “clean.”
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
              I run Car Dash Detailing with one goal: make your car look as good as I possibly can without making the process complicated. Interior, exterior, paint correction, ceramic coating—I bring the setup to you and take care of it.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-[#ef233c] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#c9182b]">Get a quote</Link>
              <Link href="/services" className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/10">See services & pricing</Link>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-neutral-500">South Elgin • St. Charles • Geneva • Naperville & nearby</p>
          </div>
          <div className="red-glow overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] p-2"><HeroImage /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ef233c]">Why Car Dash</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Good work, clear pricing, and no runaround.</h2>
          <p className="mt-4 text-neutral-400">I keep it simple. Tell me what you drive and what you want done, and I'll tell you what makes sense for the car.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {highlights.map(([title, body]) => <article key={title} className="rounded-[1.6rem] border border-white/10 bg-[#101010] p-7 transition hover:-translate-y-1 hover:border-[#ef233c]/50"><div className="mb-5 h-1 w-12 rounded-full bg-[#ef233c]"/><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-neutral-400">{body}</p></article>)}
        </div>
      </section>

      <section id="gallery" className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ef233c]">Recent work</p><h2 className="mt-4 text-3xl font-bold sm:text-4xl">The results speak for themselves.</h2></div><Link href="/gallery" className="text-sm font-semibold text-neutral-300 hover:text-white">View full gallery →</Link></div>
          <DynamicGallery limit={6} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] border border-[#ef233c]/30 bg-gradient-to-br from-[#171717] to-[#0a0a0a] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ef233c]">Ready when you are</p><h2 className="mt-4 text-3xl font-bold sm:text-4xl">Send me your year, make, model, and what you want done.</h2><p className="mt-4 text-neutral-400">I'll take a look and help you figure out the right service instead of trying to sell you something you don't need.</p></div>
          <Link href="/contact" className="mt-8 inline-flex rounded-full bg-[#ef233c] px-7 py-3.5 text-sm font-bold transition hover:bg-[#c9182b] lg:mt-0">Request a detail</Link>
        </div>
      </section>
    </div>
  );
}
