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
    <section className="border-b border-black/8 bg-[#EEF7F5] text-[#111]">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
        <div className="flex flex-col justify-center py-5 lg:py-10">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">{resolvedContent[eyebrowKey]}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[.93] tracking-[-.06em] sm:text-6xl">{resolvedContent[titleKey]}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-black/52">{resolvedContent[bodyKey]}</p>
          {action && <div className="mt-6">{action}</div>}
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-[26px] bg-black sm:min-h-[390px]">
          <SitePhoto category={imageCategory} fallbackCategory="hero" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
