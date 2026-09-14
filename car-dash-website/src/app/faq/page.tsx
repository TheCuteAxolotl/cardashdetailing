import PublicHero from "@/components/PublicHero";
import PageMediaBand from "@/components/PageMediaBand";
import { getSiteContent } from "@/lib/site-content";

export default async function FAQPage() {
  const content = await getSiteContent();
  const items = [
    { question: content.faq1Question, answer: content.faq1Answer },
    { question: content.faq2Question, answer: content.faq2Answer },
    { question: content.faq3Question, answer: content.faq3Answer },
    { question: content.faq4Question, answer: content.faq4Answer },
    { question: content.faq5Question, answer: content.faq5Answer },
    { question: content.faq6Question, answer: content.faq6Answer },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-[#111]">
      <PublicHero
        content={content}
        imageCategory="faq-hero"
        eyebrowKey="faqEyebrow"
        titleKey="faqTitle"
        bodyKey="faqBody"
        action={<a href="/#book" className="inline-flex rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-white">Book now</a>}
      />
      <PageMediaBand categories={["faq-media"]} theme="light" compact className="mx-auto max-w-5xl px-5 pt-10 sm:px-8" />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="overflow-hidden rounded-[26px] border border-black/10 bg-white">
          {items.map((item, index) => (
            <details key={index} className="group border-b border-black/8 last:border-b-0">
              <summary className="flex cursor-pointer items-center justify-between gap-5 px-5 py-5 sm:px-6 sm:py-6">
                <h2 className="text-left text-base font-semibold sm:text-lg">{item.question}</h2>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[.04] text-lg text-black/45 transition group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-6 sm:px-6">
                <p className="max-w-3xl text-sm leading-7 text-black/52 sm:text-base">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-[24px] bg-[#111] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">Still have a question?</p><p className="mt-1 text-sm text-white/45">Use the help button or call/text us.</p></div>
          <div className="flex gap-3"><a href="/#prices" className="rounded-full border border-white/12 px-4 py-2.5 text-sm font-semibold">Prices</a><a href="/#book" className="rounded-full bg-[#FF2D2D] px-4 py-2.5 text-sm font-bold">Book now</a></div>
        </div>
      </main>
    </div>
  );
}
