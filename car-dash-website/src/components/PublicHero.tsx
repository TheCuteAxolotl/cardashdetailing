import SitePhoto from "@/components/SitePhoto";
import { SiteContentKey } from "@/lib/site-defaults";
import type { SiteContent } from "@/lib/site-defaults";
import { getSiteContent } from "@/lib/site-content";

type Props = {
  imageCategory: string;
  eyebrowKey: SiteContentKey;
  titleKey: SiteContentKey;
  bodyKey: SiteContentKey;
  action?: React.ReactNode;
  content?: SiteContent;
};

export default async function PublicHero({ imageCategory, eyebrowKey, titleKey, bodyKey, action, content }: Props) {
  const resolvedContent = content ?? (await getSiteContent());

  return (
    <section className="border-b border-black/[.08] bg-[#f5f4f1] text-[#111] sm:px-5 lg:px-8">
      <div className="public-hero-shell mx-auto grid max-w-[1440px] gap-0 overflow-hidden sm:my-5 lg:my-7 lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16">
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-black/38"><span className="h-px w-8 bg-black/20" />{resolvedContent[eyebrowKey]}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl">{resolvedContent[titleKey]}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-black/50">{resolvedContent[bodyKey]}</p>
          {action && <div className="mt-8 flex flex-wrap gap-3 [&_a]:rounded-full [&_a]:border-black/10 [&_a]:px-5 [&_a]:py-3">{action}</div>}
        </div>
        <div className="public-hero-media relative min-h-[380px] bg-[#111] lg:min-h-[610px]">
          <SitePhoto category={imageCategory} fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.03),transparent_55%,rgba(0,0,0,.34))]" />
        </div>
      </div>
    </section>
  );
}
