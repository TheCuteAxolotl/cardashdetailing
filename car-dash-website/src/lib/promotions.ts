export type Promotion = {
  id: string;
  title: string;
  enabled: boolean;
  scope: "all" | "category" | "package" | "service" | "addon";
  target: string;
  type: "percent" | "fixed";
  amount: number;
  startsAt: string;
  endsAt: string;
};
export type PromotionSettings = {
  bannerEnabled: boolean;
  bannerText: string;
  bannerLink: string;
  promotions: Promotion[];
};
export const PROMOTIONS_KEY = "publicPromotionsConfig";
export const DEFAULT_PROMOTIONS: PromotionSettings = {
  bannerEnabled: false, bannerText: "", bannerLink: "/#prices", promotions: []
};
export function parsePromotions(raw: string | null | undefined): PromotionSettings {
  try {
    const value = JSON.parse(raw || "{}");
    return {
      bannerEnabled: value.bannerEnabled === true,
      bannerText: String(value.bannerText || "").slice(0, 120),
      bannerLink: /^\/(?!\/)/.test(String(value.bannerLink || "")) ? String(value.bannerLink).slice(0, 180) : "/#prices",
      promotions: Array.isArray(value.promotions) ? value.promotions.slice(0, 100).map((p: any) => ({
        id: String(p.id || "").slice(0, 80),
        title: String(p.title || "").slice(0, 100),
        enabled: p.enabled === true,
        scope: ["all","category","package","service","addon"].includes(p.scope) ? p.scope : "all",
        target: String(p.target || "").slice(0, 180),
        type: p.type === "fixed" ? "fixed" : "percent",
        amount: Number(p.amount),
        startsAt: String(p.startsAt || "").slice(0, 10),
        endsAt: String(p.endsAt || "").slice(0, 10),
      })).filter((p: Promotion) => p.id && Number.isFinite(p.amount) && p.amount > 0 && (p.type === "fixed" || p.amount <= 100)) : []
    };
  } catch { return DEFAULT_PROMOTIONS; }
}
function chicagoDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const part=(s:string)=>parts.find(p=>p.type===s)?.value || "";
  return part("year")+"-"+part("month")+"-"+part("day");
}
export function matchingPromotion(settings: PromotionSettings, category: string, itemId: string, itemType: "package" | "service" | "addon", now = new Date()) {
  const day=chicagoDay(now);
  const matches=settings.promotions.filter(p=>p.enabled && (!p.startsAt || p.startsAt<=day) && (!p.endsAt || p.endsAt>=day) &&
    (p.scope==="all" || (p.scope==="category" && p.target===category) || (p.scope===itemType && (p.target===category+":"+itemId || p.target===itemType+":"+itemId || p.target===itemId))));
  // One non-stacking promotion. Owner-created order wins.
  return matches[0] || null;
}
export function promotionalPrice(original: number, promotion: Promotion | null) {
  if (!promotion || !Number.isFinite(original) || original <= 0) return original;
  const savings=promotion.type==="percent" ? original*promotion.amount/100 : promotion.amount;
  return Math.round(Math.max(0,original-savings)*100)/100;
}
