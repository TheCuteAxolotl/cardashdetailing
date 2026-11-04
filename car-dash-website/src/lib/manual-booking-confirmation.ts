import { formatBookingTime } from "@/lib/booking-availability";

export type ManualConfirmationBooking = {
  customerName: string;
  serviceName: string;
  preferredDate: string | null;
  preferredTime: string | null;
  quotedPrice: number | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string | null;
};

function oneLine(value: string | null | undefined) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Transactional confirmation only. Never include private owner notes or internal metadata. */
export function manualBookingConfirmationText(
  booking: ManualConfirmationBooking,
  serviceAddress: string,
) {
  const first = oneLine(booking.customerName).split(" ")[0] || "there";
  const date = booking.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate)
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
      }).format(new Date(booking.preferredDate + "T12:00:00Z"))
    : "To be scheduled";
  const vehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
    .map(oneLine).filter(value => value && !/^not specified$/i.test(value)).join(" ");
  const price = booking.quotedPrice !== null && Number.isFinite(booking.quotedPrice)
    ? "$" + booking.quotedPrice.toFixed(2)
    : null;
  const address = oneLine(serviceAddress);
  return [
    "Hi " + first + "! Your Car Dash Detailing appointment is confirmed.",
    "",
    "Service: " + oneLine(booking.serviceName),
    ...(vehicle ? ["Vehicle: " + vehicle] : []),
    "Date: " + date,
    "Time: " + formatBookingTime(booking.preferredTime) + " (CT)",
    ...(address ? ["Location: " + address] : []),
    ...(price ? ["Total: " + price] : []),
    "",
    "Need to change anything? Reply to this text.",
    "— Car Dash Detailing",
  ].join("\n");
}
