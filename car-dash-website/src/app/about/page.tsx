import PublicHero from "@/components/PublicHero";
import SitePhoto from "@/components/SitePhoto";
import PageMediaBand from "@/components/PageMediaBand";
import { getSiteContent } from "@/lib/site-content";

export default async function AboutPage() {
  const content = await getSiteContent();
  // Keep the owner-written biography intact, but don't force visitors to scroll
  // through a single tall text column beside a disconnected photo.
  const storyText = String(content.aboutStoryBody || "").trim();
  const storyIsLong = storyText.length > 400;
  const previewCut = storyText.lastIndexOf(" ", 360);
  const storyPreview = storyIsLong && previewCut > 0
    ? storyText.slice(0, previewCut).trim() + "…"
    : storyText;
  const explicitParagraphs = storyText.split(/\\n\\s*\\n/).map((item) => item.trim()).filter(Boolean);
  // Text entered as one enormous paragraph gets comfortable readable paragraphs,
  // without changing or dropping any words from the full story.
  const storyParagraphs = explicitParagraphs.flatMap((paragraph) => {
    if (paragraph.length <= 540) return [paragraph];
    const sentences = paragraph.match(/[^.!?]+(?:[.!?]+(?=\\s|$)|$)/g) || [paragraph];
    const result: string[] = [];
    let segment = "";
    for (const sentence of sentences) {
      const next = sentence.trim();
      if (segment.length > 360 && segment.length + next.length > 540) {
        result.push(segment.trim());
        segment = next;
      } else {
        segment = segment ? segment + " " + next : next;
      }
    }
    if (segment.trim()) result.push(segment.trim());
    return result;
  });

  const values = [
    [content.aboutValue1Title, content.aboutValue1Body],
    [content.aboutValue2Title, content.aboutValue2Body],
    [content.aboutValue3Title, content.aboutValue3Body],
  ];

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#111]">
      <PublicHero
        content={content}
        imageCategory="about-hero"
        eyebrowKey="aboutEyebrow"
        titleKey="aboutTitle"
        bodyKey="aboutIntro"
        action={
          <div className="flex flex-wrap gap-3">
            <a href="/#prices" className="inline-flex rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white">See prices</a>
            <a href="/#book" className="inline-flex rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-semibold text-white">Book now</a>
          </div>
        }
      />

      <section className="border-b border-white/10 bg-[#161616] text-[#f4efe5]" aria-labelledby="owner-story-title">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="grid items-start gap-9 md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <div className="min-w-0">
              <div className="editorial-image overflow-hidden rounded-[20px] border border-white/10 bg-[#242424] shadow-[0_26px_65px_rgba(0,0,0,.22)]">
                <SitePhoto
                  category="about-story"
                  fallbackCategory="home-story"
                  className="aspect-[5/4] w-full object-cover sm:aspect-[4/3]"
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                <span className="text-xs font-medium uppercase tracking-[.16em] text-[#d6b779]">Car Dash Detailing</span>
                <span className="text-xs text-[#b9b5ad]">South Elgin, Illinois</span>
              </div>
            </div>

            <div className="min-w-0 max-w-[640px] lg:pt-3">
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#d6b779]">The person behind the work</p>
              <h2 id="owner-story-title" className="mt-4 font-serif text-4xl leading-[1.08] tracking-[-.04em] text-[#f4efe5] sm:text-5xl">
                {content.aboutStoryTitle}
              </h2>
              <div className="mt-6 h-px w-14 bg-[#d6b779]" />
              <p className="mt-6 max-w-[60ch] text-base leading-8 text-[#d3cec5] sm:text-[17px]">
                {storyPreview}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {storyIsLong && <a href="#full-story" className="inline-flex items-center justify-center rounded-full bg-[#d6b779] px-6 py-3 text-sm font-semibold text-[#101010] hover:bg-[#e5c995]">
                  Read the full story
                  <span aria-hidden="true" className="ml-2">↓</span>
                </a>}
                <a href="/gallery" className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-[#f4efe5] hover:border-[#d6b779]">See the work</a>
              </div>
            </div>
          </div>

          {storyIsLong && (
            <details id="full-story" className="group mt-10 scroll-mt-28 overflow-hidden rounded-[20px] border border-white/15 bg-[#1c1c1c] sm:mt-12">
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-base font-semibold text-[#f4efe5] marker:content-none sm:px-8">
                <span className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-[.18em] text-[#d6b779]">My journey</span>
                  <span>Read the complete story</span>
                </span>
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-xl text-[#d6b779] transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-white/10 px-5 pb-8 pt-7 sm:px-8 sm:pb-10">
                <div className="max-w-[72ch] space-y-5">
                  {storyParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-[15px] leading-8 text-[#d6d1c8] sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                  <a href="/gallery" className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-[#f4efe5]">See the work</a>
                  <a href="/reviews" className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-[#f4efe5]">Read reviews</a>
                </div>
              </div>
            </details>
          )}
        </div>
      </section>

      <section className="bg-[#0B1822] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">How we work</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{content.aboutValuesTitle}</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/45">Simple service, clear communication, and work we’re proud to stand behind. You’ll know what you’re paying for before the appointment starts.</p>
          </div>
          <PageMediaBand categories={["about-values-bg"]} theme="dark" compact className="mt-8" />
          <div className="luxury-value-grid mt-8 grid overflow-hidden border border-white/10 md:grid-cols-3">
            {values.map(([title, body], index) => (
              <article key={title} className={`p-6 sm:p-7 ${index ? "border-t border-white/10 md:border-l md:border-t-0" : ""}`}>
                <p className="text-xs font-bold text-[#6EAEC6]">0{index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#EEF7F5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#6EAEC6]">Ready when you are</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">See the price. Pick a time. We’ll take it from there.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/#prices" className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold">See all prices</a>
            <a href="/#book" className="rounded-full bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-white">Book now</a>
          </div>
        </div>
      </section>
    </div>
  );
}
