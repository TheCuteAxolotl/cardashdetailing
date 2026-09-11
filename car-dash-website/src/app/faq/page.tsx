"use client";

import { useEffect, useState } from "react";
import PublicHero from "@/components/PublicHero";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

export default function FAQPage() {
  const [content, setContent] = useState<Record<string, string>>({ ...SITE_DEFAULTS });

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : SITE_DEFAULTS))
      .then((data) => setContent({ ...SITE_DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    question: content[`faq${n}Question`],
    answer: content[`faq${n}Answer`],
  }));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PublicHero imageCategory="faq-hero" eyebrowKey="faqEyebrow" titleKey="faqTitle" bodyKey="faqBody" action={<a href="/contact" className="inline-flex rounded-full bg-[#00F2FE] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] hover:bg-[#00F2FE]">Still need help?</a>} />
      <main className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b]">
          {items.map((item, index) => (
            <details key={index} className="group border-b border-white/8 last:border-b-0">
              <summary className="flex cursor-pointer items-center justify-between gap-6 px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex items-start gap-4">
                  <span className="pt-1 text-[10px] font-semibold text-[#00F2FE]">0{index + 1}</span>
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
