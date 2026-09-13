export const BOOKING_AVAILABILITY_KEY = "bookingAvailabilityConfig";

export const BOOKING_DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type BookingDayKey = (typeof BOOKING_DAY_KEYS)[number];

export type BookingDayAvailability = {
  enabled: boolean;
  slots: string[];
};

export type BookingDateOverride = {
  date: string;
  closed: boolean;
  slots: string[];
  note?: string;
};

export type BookingAvailabilityConfig = {
  timezone: string;
  weekly: Record<BookingDayKey, BookingDayAvailability>;
  overrides: BookingDateOverride[];
};

const DEFAULT_SLOT_VALUES = ["09:00", "11:30", "14:00", "16:30"];

export const DEFAULT_BOOKING_AVAILABILITY: BookingAvailabilityConfig = {
  timezone: "America/Chicago",
  weekly: {
    sunday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    monday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    tuesday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    wednesday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    thursday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    friday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
    saturday: { enabled: true, slots: [...DEFAULT_SLOT_VALUES] },
  },
  overrides: [],
};

export function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeBookingTime(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const twentyFourHour = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) {
    return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;
  }

  const twelveHour = raw.match(/^(1[0-2]|0?\d):([0-5]\d)\s*(AM|PM)$/i);
  if (!twelveHour) return null;

  let hour = Number(twelveHour[1]);
  const minute = twelveHour[2];
  const period = twelveHour[3].toUpperCase();
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function formatBookingTime(value: string | null | undefined) {
  const normalized = normalizeBookingTime(value);
  if (!normalized) return String(value || "").trim();
  const [hourText, minute] = normalized.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

function sanitizeSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => normalizeBookingTime(String(item || "")))
    .filter((item): item is string => Boolean(item));
  return Array.from(new Set(normalized)).sort();
}

export function parseBookingAvailabilityConfig(value: unknown): BookingAvailabilityConfig {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = null;
    }
  }

  const source = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const weeklySource = source.weekly && typeof source.weekly === "object"
    ? (source.weekly as Record<string, unknown>)
    : {};

  const weekly = {} as Record<BookingDayKey, BookingDayAvailability>;
  for (const day of BOOKING_DAY_KEYS) {
    const fallback = DEFAULT_BOOKING_AVAILABILITY.weekly[day];
    const rawDay = weeklySource[day] && typeof weeklySource[day] === "object"
      ? (weeklySource[day] as Record<string, unknown>)
      : {};
    weekly[day] = {
      enabled: typeof rawDay.enabled === "boolean" ? rawDay.enabled : fallback.enabled,
      slots: rawDay.slots === undefined ? [...fallback.slots] : sanitizeSlots(rawDay.slots),
    };
  }

  const overrides = Array.isArray(source.overrides)
    ? source.overrides
        .map((item): BookingDateOverride | null => {
          if (!item || typeof item !== "object") return null;
          const raw = item as Record<string, unknown>;
          const date = String(raw.date || "").trim();
          if (!isDateString(date)) return null;
          return {
            date,
            closed: Boolean(raw.closed),
            slots: sanitizeSlots(raw.slots),
            note: String(raw.note || "").trim().slice(0, 160) || undefined,
          };
        })
        .filter((item): item is BookingDateOverride => Boolean(item))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return {
    timezone: typeof source.timezone === "string" && source.timezone.trim()
      ? source.timezone.trim().slice(0, 80)
      : DEFAULT_BOOKING_AVAILABILITY.timezone,
    weekly,
    overrides,
  };
}

export function dayKeyForDate(date: string): BookingDayKey | null {
  if (!isDateString(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return BOOKING_DAY_KEYS[index] || null;
}

export function configuredSlotsForDate(config: BookingAvailabilityConfig, date: string): string[] {
  const override = config.overrides.find((item) => item.date === date);
  if (override) return override.closed ? [] : [...override.slots];

  const day = dayKeyForDate(date);
  if (!day) return [];
  const weeklyDay = config.weekly[day];
  return weeklyDay.enabled ? [...weeklyDay.slots] : [];
}

export function isConfiguredBookingSlot(
  config: BookingAvailabilityConfig,
  date: string,
  time: string
) {
  const normalized = normalizeBookingTime(time);
  if (!normalized) return false;
  return configuredSlotsForDate(config, date).includes(normalized);
}
