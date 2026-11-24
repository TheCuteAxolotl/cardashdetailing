"use client";

import { useState, type ReactNode } from "react";
import type { BookingAddOn } from "@/lib/booking-pricing";
import { CONDITION_TAGS } from "@/lib/booking-conditions";

/* Gold line icons, drawn on a 24px grid. One small set covers add-ons and
   condition tags; anything unknown falls back to the sparkle. */
const ICONS: Record<string, ReactNode> = {
  paw: <><circle cx="7" cy="9" r="1.8" /><circle cx="11" cy="6" r="1.8" /><circle cx="15.5" cy="7" r="1.8" /><circle cx="18" cy="11" r="1.6" /><path d="M8.5 16.5c0-2.6 2-4.5 4.2-4.5 2.4 0 4.3 2 4.3 4.3 0 1.7-1.2 2.7-2.6 2.7-1 0-1.4-.5-2-.5s-1.1.5-2 .5c-1.1 0-1.9-1-1.9-2.5Z" /></>,
  stain: <><path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10Z" /><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5" /></>,
  odor: <><path d="M7 20c-2-2.5 2-4.5 0-7s2-4.5 0-7" /><path d="M12 20c-2-2.5 2-4.5 0-7s2-4.5 0-7" /><path d="M17 20c-2-2.5 2-4.5 0-7s2-4.5 0-7" /></>,
  smoke: <><path d="M6 19h12" /><path d="M9 15c-1.6-1.6.4-3-.8-4.8M13 15c-1.6-1.6.4-3-.8-4.8M17 15c-1.6-1.6.4-3-.8-4.8" /><path d="M6.5 6.5c2-1.5 4-1.5 5.5 0s3.5 1.5 5.5 0" /></>,
  sand: <><path d="M3 19c3-5 6-7 9-7s6 2 9 7Z" /><path d="M9 16h.01M12 14.5h.01M15 16.5h.01M11 17.5h.01" /></>,
  mud: <><path d="M4 18h16" /><path d="M7 18c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5" /><circle cx="6" cy="9" r="1.3" /><circle cx="17.5" cy="7.5" r="1.1" /><circle cx="12" cy="6" r="1.6" /></>,
  cup: <><path d="M6 8h11l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3Z" /><path d="M9 8V5.5h5V8" /><path d="M14 3.5h3" /><path d="M8.5 13h6" /></>,
  bug: <><ellipse cx="12" cy="13.5" rx="4" ry="5.5" /><path d="M12 8v11M9.5 6.5 8 4.5M14.5 6.5 16 4.5M8 11H5M8 15.5H5M16 11h3M16 15.5h3" /></>,
  mold: <><circle cx="8" cy="9" r="2.3" /><circle cx="15.5" cy="8" r="1.6" /><circle cx="14" cy="15.5" r="2.8" /><circle cx="7.5" cy="16" r="1.3" /><path d="M10.2 9.8 12 12M11 15.5H9" /></>,
  seat: <><path d="M8 4h6a2 2 0 0 1 2 2v7H7V5a1 1 0 0 1 1-1Z" /><path d="M5 13h13l1 4H5Z" /><path d="M7 17v3M17 17v3" /></>,
  carpet: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 9.7h16M4 14.3h16M9.3 5v14M14.7 5v14" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  engine: <><path d="M4 10h3l1.5-2h6L16 10h2v3h2v-2h1v6h-1v-2h-2v3h-3l-1.5 1.5H8.5L7 17H4Z" /><path d="M8 8V5.5h6V8" /></>,
  clay: <><rect x="4.5" y="8" width="15" height="8" rx="4" /><path d="M8 12h8" /></>,
  magnet: <><path d="M6 4v8a6 6 0 0 0 12 0V4h-3.5v8a2.5 2.5 0 0 1-5 0V4Z" /><path d="M6 7.5h3.5M14.5 7.5H18" /></>,
  shine: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m12 8.5 1.2 2.3 2.3 1.2-2.3 1.2L12 15.5l-1.2-2.3L8.5 12l2.3-1.2Z" /></>,
  wheel: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="M12 4v5.5M12 14.5V20M4 12h5.5M14.5 12H20" /></>,
  trim: <><path d="M3 15.5 5.5 11 9 9h6.5l3.5 2.5 2 1v3Z" /><path d="M5 13.3h14" /><circle cx="7.5" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /></>,
  under: <><path d="M3.5 10 6 6.5h12L20.5 10Z" /><path d="M3.5 10v3h17v-3" /><path d="M6 16h12M8 19h8" /></>,
  headlight: <><path d="M10 6c-3.3 0-5 2.7-5 6s1.7 6 5 6Z" /><path d="M13 7.5 20 6M13 12h7.5M13 16.5l7 1.5" /></>,
};

function Icon({ name, className = "h-7 w-7" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || ICONS.shine}
    </svg>
  );
}

function addOnIcon(addOn: BookingAddOn) {
  const value = `${addOn.id} ${addOn.name}`.toLowerCase();
  if (/pet/.test(value)) return "paw";
  if (/seat/.test(value)) return "seat";
  if (/carpet/.test(value)) return "carpet";
  if (/stain/.test(value)) return "stain";
  if (/leather|trim.protect/.test(value)) return "shield";
  if (/smoke/.test(value)) return "smoke";
  if (/odor/.test(value)) return "odor";
  if (/engine/.test(value)) return "engine";
  if (/iron/.test(value)) return "magnet";
  if (/clay/.test(value)) return "clay";
  if (/wheel/.test(value)) return "wheel";
  if (/bug|tar/.test(value)) return "bug";
  if (/underbody/.test(value)) return "under";
  if (/headlight/.test(value)) return "headlight";
  if (/trim/.test(value)) return "trim";
  return "shine";
}

/** Short plain-language answers for the ⓘ button. Unknown add-ons show only time. */
const ADD_ON_INFO: Record<string, string> = {
  "pet-hair": "Pulls embedded pet hair out of carpets, mats and cloth seats.",
  "seat-shampoo": "Shampoo and extraction for cloth seats to lift dirt, spills and light stains.",
  "carpet-extraction": "Hot-water extraction for carpets and mats when a vacuum isn't enough.",
  "heavy-stains": "Extra time and treatment for set-in stains like coffee, makeup or food.",
  "leather-protection": "Conditions and protects leather after cleaning so it stays soft.",
  "odor-treatment": "Targets everyday odors at the source, not just with fragrance.",
  "odor-smoke": "A longer treatment aimed at smoke odor in fabric, headliner and vents.",
  "odor-severe": "For severe odors. Needs an inspection and custom quote before booking.",
  "engine-bay": "Careful cleaning and dressing of the engine bay plastics and surfaces.",
  "iron-decon": "Dissolves iron particles bonded to paint and wheels before protection.",
  "clay-bar": "Removes bonded contamination so the paint feels smooth again.",
  "hand-wax": "A hand-applied wax for extra gloss and short-term protection.",
  "ceramic-sealant": "A ceramic sealant for gloss, water beading and months of protection.",
  "wheel-coating": "Protects wheel faces so brake dust washes off more easily.",
  "trim-protection": "Restores and protects faded exterior plastic trim.",
  "bug-tar": "Safely removes bug splatter and road tar from paint and glass.",
  "underbody": "Rinses salt and grime from the underside of the vehicle.",
  "headlight-restoration": "Removes yellowing from headlight lenses and protects them.",
};

type Priced = { price: number; sale: number };
const money = (value: number) => `$${value % 1 ? value.toFixed(2) : value.toFixed(0)}`;

function PriceTag({ priced, quote }: { priced: Priced; quote?: boolean }) {
  return (
    <span className="whitespace-nowrap text-sm font-semibold text-[#ead5a8]">
      {priced.sale < priced.price && <s className="mr-1.5 text-xs font-normal text-white/35">{money(priced.price)}</s>}
      +{money(priced.sale)}{quote ? "+" : ""}
    </span>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${on ? "border-[#d6b779] bg-[#d6b779] text-[#171717]" : "border-white/25"}`}>
      {on && <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>}
    </span>
  );
}

/** Add-ons as picture cards: tap to add, ⓘ to see what it is. */
export function AddOnCards({ addOns, selected, onToggle, priceFor }: {
  addOns: BookingAddOn[];
  selected: string[];
  onToggle: (id: string) => void;
  priceFor: (addOn: BookingAddOn) => Priced;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {addOns.map((addOn) => {
        const on = selected.includes(addOn.id);
        const info = ADD_ON_INFO[addOn.id];
        const minutes = addOn.durationMinutes;
        return (
          <div key={addOn.id} className={`relative flex flex-col rounded-2xl border transition ${on ? "border-[#d6b779] bg-[#d6b779]/[.1]" : "border-white/10 bg-[#222] hover:border-[#d6b779]/50"}`}>
            <button type="button" aria-pressed={on} onClick={() => onToggle(addOn.id)} className="flex flex-1 flex-col items-start gap-2 rounded-2xl p-3.5 pb-12 text-left active:scale-[.98] transition-transform">
              <span className={on ? "text-[#ead5a8]" : "text-[#d6b779]"}><Icon name={addOnIcon(addOn)} /></span>
              <span className="text-sm font-semibold leading-snug text-white">{addOn.name.replace(/\s*\(from \$\d+\)$/i, "")}</span>
              <PriceTag priced={priceFor(addOn)} quote={addOn.quoteRequired} />
              {addOn.quoteRequired && <span className="text-[11px] leading-4 text-amber-200">Needs an inspection and custom quote</span>}
            </button>
            <div className="pointer-events-none absolute inset-x-3.5 bottom-3 flex items-center justify-between">
              <button type="button" aria-expanded={open === addOn.id} aria-label={`What is ${addOn.name}?`} onClick={() => setOpen(open === addOn.id ? null : addOn.id)}
                className="pointer-events-auto -m-2 grid h-10 w-10 place-items-center rounded-full text-white/45 hover:text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6h.01" /></svg>
              </button>
              <Check on={on} />
            </div>
            {open === addOn.id && (
              <p className="border-t border-white/10 px-3.5 py-3 text-xs leading-5 text-white/65">
                {info || "Ask us if you're not sure whether you need it."}
                {minutes ? <span className="mt-1 block text-white/40">Adds about {minutes} min.</span> : null}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * "Anything else we should know?" Condition tags help the detailer prepare.
 * Each can suggest a matching add-on with its price; nothing is charged
 * unless the customer taps Add.
 */
export function ConditionTags({ value, onChange, addOns, selectedAddOns, onAddAddOn, priceFor }: {
  value: string[];
  onChange: (tags: string[]) => void;
  addOns: BookingAddOn[];
  selectedAddOns: string[];
  onAddAddOn: ((id: string) => void) | null;
  priceFor: (addOn: BookingAddOn) => Priced;
}) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  const chosen = CONDITION_TAGS.filter((tag) => value.includes(tag.id));
  const suggestions = onAddAddOn
    ? [...new Map(chosen.flatMap((tag) => {
        const match = (tag.suggest || []).map((id) => addOns.find((item) => item.id === id && !item.quoteRequired)).find(Boolean);
        return match && !selectedAddOns.includes(match.id) ? [[match.id, { addOn: match, reason: tag.label }] as const] : [];
      })).values()]
    : [];
  const needsLook = chosen.some((tag) => tag.mayNeedQuote);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {CONDITION_TAGS.map((tag) => {
          const on = value.includes(tag.id);
          return (
            <button key={tag.id} type="button" aria-pressed={on} onClick={() => toggle(tag.id)}
              className={`relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-semibold transition active:scale-[.97] ${on ? "border-[#d6b779] bg-[#d6b779]/[.1] text-white" : "border-white/10 bg-[#222] text-white/70 hover:border-[#d6b779]/50"}`}>
              {on && <span aria-hidden="true" className="absolute right-2 top-2 text-[#d6b779]"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg></span>}
              <span className={on ? "text-[#ead5a8]" : "text-[#d6b779]"}><Icon name={tag.icon} className="h-8 w-8" /></span>
              {tag.label}
            </button>
          );
        })}
      </div>
      {(suggestions.length > 0 || needsLook) && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {suggestions.map(({ addOn, reason }) => (
            <div key={addOn.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#d6b779]/25 bg-[#d6b779]/[.06] px-3 py-2.5 text-xs text-white/75">
              <span><strong className="text-white">{reason}?</strong> Add {addOn.name} <PriceTag priced={priceFor(addOn)} /></span>
              <button type="button" onClick={() => onAddAddOn?.(addOn.id)} className="min-h-9 shrink-0 rounded-lg bg-[#d6b779] px-3 text-xs font-bold text-[#171717] hover:bg-[#e8cf9e]">Add</button>
            </div>
          ))}
          {needsLook && <p className="rounded-xl border border-amber-300/25 bg-amber-900/15 px-3 py-2.5 text-xs leading-5 text-amber-100">Mold can need extra treatment. We&apos;ll check your photos or the car and confirm any change with you before we start.</p>}
        </div>
      )}
    </div>
  );
}
