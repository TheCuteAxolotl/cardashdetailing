import { stripBookingPhotos, extractBookingPhotos, embedBookingPhotos } from "@/lib/booking-photos";

const START = "[[CAR_DASH_OWNER_NOTES]]";
const END = "[[/CAR_DASH_OWNER_NOTES]]";
const ADDRESS_LINE = /^Service address:\s*([^\r\n]*)/gim;
const LEGACY_OWNER_LINE = /^Owner (?:scheduling )?notes:\s*([^\r\n]*)\r?\n?/gim;

export function bookingServiceAddress(notes: string | null | undefined): string {
  const source = stripBookingPhotos(notes);
  const matches = [...source.matchAll(ADDRESS_LINE)];
  const current = matches.length ? matches[matches.length - 1][1].trim() : "";
  return /^(not specified|none|n\/a)$/i.test(current) ? "" : current;
}

export function bookingOwnerNotes(notes: string | null | undefined): string {
  const text = stripBookingPhotos(notes);
  const start = text.indexOf(START);
  const end = text.indexOf(END, start + START.length);
  if (start >= 0 && end > start) return text.slice(start + START.length, end).trim();
  const old = [...text.matchAll(LEGACY_OWNER_LINE)].map(match => match[1].trim()).filter(Boolean);
  return old.join("\n");
}

/** Update only owner-controlled address/notes. Retain consent, price/duration,
 * original customer notes, discount identifiers, and attached booking photos. */
export function replaceBookingOwnerDetails(
  notes: string | null | undefined,
  address: string,
  ownerNotes: string
): string {
  const photos = extractBookingPhotos(notes);
  let text = stripBookingPhotos(notes);
  text = text.replace(/\[\[CAR_DASH_OWNER_NOTES\]\][\s\S]*?\[\[\/CAR_DASH_OWNER_NOTES\]\]/g, "");
  text = text.replace(LEGACY_OWNER_LINE, "");
  const safeAddress = address.replace(/[\r\n\t]+/g, " ").trim().slice(0, 500);
  text = text.replace(ADDRESS_LINE, "").trim();
  if (safeAddress) text = [text, `Service address: ${safeAddress}`].filter(Boolean).join("\n");
  const safeNotes = ownerNotes.replaceAll(START, "").replaceAll(END, "").trim().slice(0, 4000);
  if (safeNotes) text = [text, `${START}\n${safeNotes}\n${END}`].filter(Boolean).join("\n\n");
  return embedBookingPhotos(text, photos);
}
