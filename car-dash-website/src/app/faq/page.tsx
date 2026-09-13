import PublicHero from "@/components/PublicHero";
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
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PublicHero content={content} imageCategory="faq-hero" eyebrowKey="faqEyebrow" titleKey="faqTitle" bodyKey="faqBody" action={<a href="/contact" className="inline-flex rounded-full bg-[#FF2D2D] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] hover:bg-[#FF2D2D]">Still need help?</a>} />
      <main className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b]">
          {items.map((item, index) => (
            <details key={index} className="group border-b border-white/8 last:border-b-0">
              <summary className="flex cursor-pointer items-center justify-between gap-6 px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex items-start gap-4">
                  <span className="pt-1 text-[10px] font-semibold text-[#FF2D2D]">0{index + 1}</span>
                  <h2 className="text-left text-lg font-semibold tracking-[-.02em] sm:text-xl">{item.question}</h2>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-lg text-white/45 transition group-open:rotate-45 group-open:text-white">+</span>
              </summary>
              <div className="px-6 pb-7 pl-[4.2rem] sm:px-8 sm:pb-8 sm:pl-[5rem]">
                <p className="max-w-3xl text-sm leading-7 text-white/48 sm:text-base">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
