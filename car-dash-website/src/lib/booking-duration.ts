import { normalizeBookingTime } from "@/lib/booking-availability";

export function timeMinutes(time: string) {
  const n = normalizeBookingTime(time);
  if (!n) return null;
  const [h, m] = n.split(":").map(Number);
  return h * 60 + m;
}

export function normalizeServiceMinutes(value: unknown, fallback = 180) {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 15 && minutes <= 960
    ? Math.min(960, Math.ceil(minutes / 15) * 15)
    : fallback;
}

// Starting estimates only. Every one is editable from Owner > Booking Settings.
const PACKAGE_MINUTES: Record<string, [number, number, number]> = {
  "packages:essential": [150, 180, 210],
  "packages:complete": [240, 270, 300],
  "packages:signature": [360, 420, 480],
  "interior:interior-refresh": [90, 120, 150],
  "interior:full-interior": [180, 210, 240],
  "interior:deep-reset": [240, 300, 360],
  "exterior:maintenance-wash": [75, 90, 105],
  "exterior:full-exterior": [150, 180, 210],
  "exterior:paint-enhancement": [240, 300, 360],
};

export function recommendedServiceMinutes(target: string | null | undefined, name: string) {
  const match = /^package:(packages|interior|exterior):([^:]+):(coupe|sedan|truckSuv)$/.exec(target || "");
  if (match) {
    const index = match[3] === "coupe" ? 0 : match[3] === "sedan" ? 1 : 2;
    const stored = PACKAGE_MINUTES[`${match[1]}:${match[2]}`];
    if (stored) return stored[index];
    const normalized = name.toLowerCase();
    const base = /signature|deep reset|paint enhancement/.test(normalized) ? 360
      : /full detail|full interior|full exterior|complete/.test(normalized) ? 240
      : /essential|refresh|maintenance/.test(normalized) ? 150 : 180;
    return Math.min(960, base + index * 30);
  }
  const normalized = name.toLowerCase();
  if (/headlight/.test(normalized)) return 90;
  if (/ceramic coating|ceramic application/.test(normalized)) return 600;
  if (/paint correction|three.step|3.step/.test(normalized)) return 360;
  if (/paint enhancement|one.step|1.step/.test(normalized)) return 240;
  if (/marine|boat/.test(normalized)) return 480;
  if (/signature/.test(normalized)) return 360;
  if (/full detail|premium|ultimate/.test(normalized)) return 240;
  if (/essential|basic/.test(normalized)) return 150;
  if (/interior/.test(normalized)) return 180;
  if (/exterior/.test(normalized)) return 120;
  return 180;
}

export function recommendedAddOnMinutes(name: string, id = "") {
  const value = `${id} ${name}`.toLowerCase();
  if (/odor-severe|severe odor|odor restoration/.test(value)) return 240;
  if (/odor-smoke|smoke odor|cigarette|cannabis/.test(value)) return 150;
  if (/odor-general|general odor|odor treatment|odor-focused/.test(value)) return 90;
  if (/headlight/.test(value)) return 90;
  if (/pet.hair.heavy/.test(value)) return 90;
  if (/pet.hair/.test(value)) return 45;
  if (/carpet.extraction|carpet shampoo/.test(value)) return 75;
  if (/seat.shampoo|extraction|heavy.stain/.test(value)) return 60;
  if (/paint.correction|paint.enhancement/.test(value)) return 180;
  if (/clay|engine.bay|wheel.coat/.test(value)) return 45;
  if (/iron|wax|sealant|trim|leather|bug|tar|underbody/.test(value)) return 30;
  return 30;
}

export function durationForBooking(serviceName: string, addOnNames: string[] = [], explicitMinutes?: number) {
  if (Number.isFinite(explicitMinutes) && Number(explicitMinutes) >= 30) return normalizeServiceMinutes(explicitMinutes, 180);
  const base = recommendedServiceMinutes(null, serviceName);
  return Math.min(960, base + addOnNames.reduce((total, name) => total + recommendedAddOnMinutes(name), 0));
}

// Keep customer availability and server-side slot protection on the same calculation.
export function totalBookingMinutes(
  serviceName: string,
  addOns: Array<{ name: string; id?: string; durationMinutes?: number }>,
  configuredBaseMinutes?: number,
) {
  const base = durationForBooking(serviceName, [], configuredBaseMinutes);
  return Math.min(960, base + addOns.reduce((total, addOn) =>
    total + normalizeServiceMinutes(addOn.durationMinutes, recommendedAddOnMinutes(addOn.name, addOn.id)), 0));
}

export function savedDuration(notes: string | null | undefined, serviceName: string) {
  const match = String(notes || "").match(/^Estimated duration minutes:\s*(\d+)/m);
  if (match) return durationForBooking(serviceName, [], Number(match[1]));
  const add = String(notes || "").match(/^Add-ons:\s*(.*)$/m)?.[1] || "";
  const names = add === "None" ? [] : add.split(/,\s*/).filter(Boolean).map(x => x.replace(/\s*\(\+\$.*$/, ""));
  return durationForBooking(serviceName, names);
}

export function fitsWithoutOverlap(start: number, duration: number, busy: { start: number; duration: number }[], close: number) {
  return start + duration <= close && !busy.some(b => start < b.start + b.duration && b.start < start + duration);
}
