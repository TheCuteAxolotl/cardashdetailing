"use client";

import { useMemo, useState } from "react";
import styles from "./HomeHeroGlass.module.css";
import type { SiteContent } from "@/lib/site-defaults";
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS, parsePricingConfig, type PricingPageConfig, type VehicleClass } from "@/lib/pricing-config";
import type { MediaItem } from "@/lib/media";
import type { GoogleReviewData } from "@/lib/use-google-reviews";
import Hero360Viewer from "@/components/Hero360Viewer";
import SitePhoto from "@/components/SitePhoto";

type Kind = "packages" | "interior" | "exterior";
const KIND_LABELS: Record<Kind, string> = { packages: "Inside + outside", interior: "Interior only", exterior: "Exterior only" };
const VEHICLES: VehicleClass[] = ["coupe", "sedan", "truckSuv"];

function Icon({ name }: { name: "star" | "drop" | "shield" | "car" | "spark" | "tag" | "arrow" | "pin" }) {
  const paths: Record<string, string> = {
    star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
    drop: "M12 3.5s-6 6.6-6 10.8a6 6 0 0012 0C18 10.1 12 3.5 12 3.5z",
    shield: "M12 3.5l7 2.8v5.4c0 4.4-3 7.6-7 8.8-4-1.2-7-4.4-7-8.8V6.3z M9 12l2 2 4-4",
    car: "M4 15.5v-3l2-4.5h12l2 4.5v3 M4 15.5h16v2.5h-3v-2.5 M7 18v-2.5 M3 11.5h2 M19 11.5h2 M7.5 13h.01 M16.5 13h.01",
    spark: "M12 3.5v4 M12 16.5v4 M3.5 12h4 M16.5 12h4 M6.5 6.5l2.5 2.5 M15 15l2.5 2.5 M17.5 6.5L15 9 M9 15l-2.5 2.5",
    tag: "M3.5 12.2V4.5h7.7l9.3 9.3-7.7 7.7z M8 8h.01",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  };
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

type Props = {
  content: SiteContent;
  pricingConfig: PricingPageConfig;
  hero360Frames?: MediaItem[];
  reviewData?: GoogleReviewData | null;
  towns: string[];
};

export default function HomeHeroGlass({ content, pricingConfig, hero360Frames = [], reviewData, towns }: Props) {
  const [interacting, setInteracting] = useState(false);
  const configs = useMemo<Record<Kind, PricingPageConfig>>(() => ({
    packages: pricingConfig,
    interior: parsePricingConfig(content.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
    exterior: parsePricingConfig(content.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
  }), [pricingConfig, content.pricingInteriorConfig, content.pricingExteriorConfig]);

  const featured = pricingConfig.packages.find((pkg) => pkg.featured) || pricingConfig.packages[0];
  const [kind, setKind] = useState<Kind>("packages");
  const [vehicle, setVehicle] = useState<VehicleClass>("coupe");
  const [packageId, setPackageId] = useState(featured?.id || "");

  const choices = configs[kind].packages.filter((pkg) => Number(pkg.prices?.[vehicle] || 0) > 0);
  const chosen = choices.find((pkg) => pkg.id === packageId) || choices.find((pkg) => pkg.featured) || choices[0];
  const bookHref = chosen
    ? `/?pricingPage=${kind}&packageId=${encodeURIComponent(chosen.id)}&vehicleClass=${vehicle}#book`
    : `/?pricingPage=${kind}#book`;
  const featuredPrice = featured ? Number(featured.prices?.coupe || 0) : 0;
  const rating = reviewData && reviewData.rating !== null ? reviewData.rating : null;

  return (
    <section className={styles.hero} aria-labelledby="home-hero-heading">
      <div className={styles.shell}>
        <div className={styles.media}>
          {hero360Frames.length > 0 ? (
            <Hero360Viewer frames={hero360Frames} className="absolute inset-0 h-full w-full" onInteractionChange={setInteracting} />
          ) : (
            <SitePhoto category="hero" fallbackCategory="home-showcase-primary" className="absolute inset-0 h-full w-full object-cover" alt="Car Dash Detailing finished vehicle" />
          )}
          <div className={styles.shade} data-hidden={interacting || undefined} />
        </div>

        <div className={styles.inner} data-hidden={interacting || undefined}>
          <div className={styles.copy}>
            {rating !== null ? (
              <a href="#reviews" className={styles.badge} aria-label={`Rated ${rating.toFixed(1)} out of 5${reviewData?.reviewCount ? ` from ${reviewData.reviewCount} Google reviews` : ""}. Jump to reviews.`}>
                <span className={styles.badgeIcon}><Icon name="star" /></span>
                {rating.toFixed(1)} on Google{reviewData?.reviewCount ? ` · ${reviewData.reviewCount} reviews` : ""}
              </a>
            ) : (
              <p className={styles.badge}><span className={styles.badgeIcon}><Icon name="pin" /></span>{content.heroEyebrow || "Mobile detailing · South Elgin, IL"}</p>
            )}
            <h1 id="home-hero-heading" className={styles.title}>
              <span className={styles.line}><span>Your car,</span></span>{" "}
              <span className={styles.line}><span><em>detailed</em> in your</span></span>{" "}
              <span className={styles.line}><span>driveway.</span></span>
            </h1>
            <p className={styles.lede}>Mobile detailing across South Elgin and the Fox Valley, with the price shown before you book. We’re not satisfied until <strong>you’re satisfied.</strong></p>
          </div>

          <div className={`${styles.chip} ${styles.chipTop}`} aria-hidden="true">
            <span className={styles.chipIcon}><Icon name="drop" /></span>
            <span><strong>Water + power on board</strong><small>No hose or outlet needed</small></span>
          </div>
          <div className={`${styles.chip} ${styles.chipMid}`} aria-hidden="true">
            <span><strong>Foam pre-wash first</strong><small>Paint-safe hand wash, every time</small></span>
          </div>

          {featured && (
            <a href={`/?pricingPage=packages&packageId=${encodeURIComponent(featured.id)}&vehicleClass=coupe#book`} className={styles.card}>
              <div className={styles.cardPhoto}>
                <SitePhoto category={`pricing-car-packages-pkg-${featured.id}`} fallbackCategory="pricing-car-packages-hero" className="absolute inset-0 h-full w-full object-cover" alt={featured.name} />
                <span className={styles.cardBadge}><i />{featured.badge || "Most booked"}</span>
              </div>
              <div className={styles.cardBody}>
                <h2>{featured.name}</h2>
                <p className={styles.cardMeta}><Icon name="car" /> Inside + outside · {VEHICLE_LABELS.coupe}</p>
                <div className={styles.cardFoot}>
                  {featuredPrice > 0 && <span className={styles.cardPrice}><small>From</small>${featuredPrice}</span>}
                  <span className={styles.cardCta}>Book <Icon name="arrow" /></span>
                </div>
              </div>
            </a>
          )}

          <div className={styles.dock}>
            <form className={styles.bar} action="/" onSubmit={(event) => { event.preventDefault(); window.location.assign(bookHref); }}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}><Icon name="car" /></span>
                <span className={styles.fieldText}>
                  <small>Vehicle</small>
                  <select className={styles.select} value={vehicle} onChange={(event) => setVehicle(event.target.value as VehicleClass)}>
                    {VEHICLES.map((value) => <option key={value} value={value}>{VEHICLE_LABELS[value]}</option>)}
                  </select>
                </span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldIcon}><Icon name="spark" /></span>
                <span className={styles.fieldText}>
                  <small>Service</small>
                  <select className={styles.select} value={kind} onChange={(event) => { setKind(event.target.value as Kind); setPackageId(""); }}>
                    {(Object.keys(KIND_LABELS) as Kind[]).map((value) => <option key={value} value={value}>{KIND_LABELS[value]}</option>)}
                  </select>
                </span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldIcon}><Icon name="tag" /></span>
                <span className={styles.fieldText}>
                  <small>Package</small>
                  <select className={styles.select} value={chosen?.id || ""} onChange={(event) => setPackageId(event.target.value)}>
                    {choices.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · ${Number(pkg.prices[vehicle])}</option>)}
                  </select>
                </span>
              </label>
              <button type="submit" className={styles.go}>
                <span>Book{chosen ? <> · <b>${Number(chosen.prices[vehicle])}</b></> : null}</span><Icon name="arrow" />
              </button>
            </form>
            <nav className={styles.thumbs} aria-label="Explore services">
              {[
                { href: "/interior-detailing", label: "Interior", image: "pricing-interior-hero", fallback: "home-showcase-secondary" },
                { href: "/exterior-detailing", label: "Exterior", image: "pricing-exterior-hero", fallback: "home-showcase-primary" },
                { href: "/ceramic-coatings", label: "Ceramic", image: "ceramic-coatings-hero", fallback: "hero" },
              ].map((item) => (
                <a key={item.href} href={item.href} className={styles.thumb}>
                  <SitePhoto category={item.image} fallbackCategory={item.fallback} className="absolute inset-0 h-full w-full object-cover" alt="" />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className={styles.strip} aria-label="Service area">
        <p>Serving</p>
        <ul>
          {towns.map((town) => <li key={town}>{town}</li>)}
        </ul>
        <a href="/quote">Somewhere else? Ask us</a>
      </div>
    </section>
  );
}
