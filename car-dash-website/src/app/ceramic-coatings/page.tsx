import PricingMediaStrip from "@/components/PricingMediaStrip";
import RelatedServiceLinks from "@/components/RelatedServiceLinks";
import SitePhoto from "@/components/SitePhoto";

const systems = [
  ["GYEON Synchro", "Layered ceramic system", "Strong gloss, slickness, chemical resistance, and water behavior after the paint has been properly cleaned and prepared."],
  ["Gtechniq", "Professional ceramic protection", "Durable coating options matched to the vehicle and the level of protection you want instead of forcing the same system on every job."],
] as const;

export default function CeramicCoatingsPage() {
  return (
    <main className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-3 lg:py-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Ceramic coating</p><h1 className="mt-3 text-5xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">Good coating starts with good prep.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-black/52">We use GYEON and Gtechniq systems. The paint is washed, decontaminated, and corrected as needed before the coating goes on.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/#specialty-prices" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white">See current prices</a><a href="/quote" className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-white">Get exact quote</a><a href="/#book" className="rounded-full border border-black/12 px-5 py-3 text-sm font-semibold">Book</a></div></div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[380px]"><SitePhoto category="ceramic-coatings-hero" fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <PricingMediaStrip category="ceramic-results" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {systems.map(([name, tag, body]) => <article key={name} className="rounded-[24px] border border-black/10 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6EAEC6]">{tag}</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{name}</h2><p className="mt-3 text-sm leading-6 text-black/48">{body}</p></article>)}
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#111] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">What it does</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">More gloss, easier washing, better water behavior, and longer-term paint protection.</h2></div>
          <div><p className="text-sm leading-7 text-white/48">Ceramic coating does not make paint scratch-proof. It still needs proper washing and maintenance. The prep work underneath the coating matters just as much as the coating itself.</p><a href="/paint-correction" className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold">See paint correction →</a></div>
        </div>
      </section>

      <RelatedServiceLinks currentPath="/ceramic-coatings" />
    </main>
  );
}
