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
    <section className="relative isolate min-h-[560px] overflow-hidden border-b border-white/10 bg-black text-white sm:min-h-[620px]">
      <SitePhoto category={imageCategory} fallbackCategory="hero" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.93)_0%,rgba(0,0,0,.72)_48%,rgba(0,0,0,.35)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.68))]" />
      <div className="mx-auto flex min-h-[560px] max-w-[1540px] items-end border-x border-white/10 px-5 py-14 sm:min-h-[620px] sm:px-8 sm:py-20 lg:px-10">
        <div className="max-w-4xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#FF2D2D]">{resolvedContent[eyebrowKey]}</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[6.5rem]">{resolvedContent[titleKey]}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">{resolvedContent[bodyKey]}</p>
          {action && <div className="mt-8">{action}</div>}
        </div>
      </div>
    </section>
  );
}
