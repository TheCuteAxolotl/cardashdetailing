import { formatBookingTime, normalizeBookingTime } from "@/lib/booking-availability";
import { bookingServiceAddress } from "@/lib/booking-owner-details";

export const APPOINTMENT_REMINDER_LEAD_MINUTES = 120;
export const APPOINTMENT_REMINDER_GRACE_MINUTES = 10;
export const DEFAULT_REMINDER_TIMEZONE = "America/Chicago";

export type ReminderBooking = {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  preferredDate: string | null;
  preferredTime: string | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string | null;
  notes: string | null;
};

// Compare actual future instants in the booking timezone, not the server timezone.
// This also handles ordinary date rollovers and Chicago daylight saving changes.
export function localBookingDateTime(at: Date, timezone = DEFAULT_REMINDER_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const part = (name: string) => parts.find((item) => item.type === name)?.value || "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function reminderDateCandidates(now: Date, timezone = DEFAULT_REMINDER_TIMEZONE) {
  const early = new Date(now.getTime() + (APPOINTMENT_REMINDER_LEAD_MINUTES - APPOINTMENT_REMINDER_GRACE_MINUTES) * 60_000);
  const onTime = new Date(now.getTime() + APPOINTMENT_REMINDER_LEAD_MINUTES * 60_000);
  return Array.from(new Set([
    localBookingDateTime(early, timezone).slice(0, 10),
    localBookingDateTime(onTime, timezone).slice(0, 10),
  ]));
}

export function isDueForReminder(
  booking: Pick<ReminderBooking, "status" | "preferredDate" | "preferredTime">,
  now: Date,
  timezone = DEFAULT_REMINDER_TIMEZONE,
) {
  if (booking.status !== "confirmed" || !booking.preferredDate) return false;
  const time = normalizeBookingTime(booking.preferredTime);
  if (!time) return false;
  const scheduled = `${booking.preferredDate}T${time}`;
  const windowStart = localBookingDateTime(
    new Date(now.getTime() + (APPOINTMENT_REMINDER_LEAD_MINUTES - APPOINTMENT_REMINDER_GRACE_MINUTES) * 60_000),
    timezone,
  );
  const windowEnd = localBookingDateTime(
    new Date(now.getTime() + APPOINTMENT_REMINDER_LEAD_MINUTES * 60_000),
    timezone,
  );
  return scheduled >= windowStart && scheduled <= windowEnd;
}

function inline(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

export function appointmentReminderBody(booking: ReminderBooking, timezone = DEFAULT_REMINDER_TIMEZONE) {
  const firstName = inline(booking.customerName).split(" ")[0] || "there";
  const date = booking.preferredDate || "";
  const displayDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  const service = inline(booking.serviceName);
  const vehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim || ""]
    .map(inline).filter((v) => v && !/^not specified$/i.test(v)).join(" ");
  const address = inline(bookingServiceAddress(booking.notes));
  const timezoneLabel = timezone === "America/Chicago" ? "CT" : timezone;

  return [
    `Hi ${firstName}! Your Car Dash Detailing appointment is coming up in about 2 hours.`,
    "",
    `Service: ${service}`,
    ...(vehicle ? [`Vehicle: ${vehicle}`] : []),
    `Date: ${displayDate}`,
    `Time: ${formatBookingTime(booking.preferredTime)} (${timezoneLabel})`,
    ...(address ? [`Location: ${address}`] : []),
    "",
    "Please remove personal valuables and make sure the vehicle is accessible. Need to update anything? Just reply to this text.",
    "— Car Dash Detailing",
  ].join("\n");
}
