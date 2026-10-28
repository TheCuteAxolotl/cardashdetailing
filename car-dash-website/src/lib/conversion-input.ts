// Conversion requires an explicit price; manual booking keeps its optional-price policy.
export function conversionPrice(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return null;
  const cents = Math.round(price * 100);
  return Number.isSafeInteger(cents) ? cents / 100 : null;
}

export function conversionDuration(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 30 && minutes <= 960
    ? Math.ceil(minutes / 15) * 15 : null;
}
