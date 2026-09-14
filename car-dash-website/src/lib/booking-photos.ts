const START = "[[CAR_DASH_BOOKING_PHOTOS]]";
const END = "[[/CAR_DASH_BOOKING_PHOTOS]]";

export function embedBookingPhotos(notes: string, photos: string[]) {
  const clean = stripBookingPhotos(notes).trim();
  if (!photos.length) return clean;
  return `${clean}${clean ? "\n\n" : ""}${START}${JSON.stringify(photos)}${END}`;
}

export function extractBookingPhotos(notes: string | null | undefined): string[] {
  const value = String(notes || "");
  const start = value.indexOf(START);
  const end = value.indexOf(END, start + START.length);
  if (start < 0 || end < 0) return [];
  try {
    const parsed = JSON.parse(value.slice(start + START.length, end));
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && /^data:image\/(?:jpeg|png|webp);base64,/i.test(item)).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export function stripBookingPhotos(notes: string | null | undefined) {
  const value = String(notes || "");
  const start = value.indexOf(START);
  const end = value.indexOf(END, start + START.length);
  if (start < 0 || end < 0) return value;
  return `${value.slice(0, start)}${value.slice(end + END.length)}`.trim();
}
