import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

/** Prevent SMS being delivered to a phone that has been released by a
 * previous account holder. Historical bookings remain available for records. */
export async function bookingPhoneWasReleased(
  phone: string | null | undefined, bookingCreatedAt: Date | string | null | undefined,
): Promise<boolean> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized || !bookingCreatedAt) return false;
  const created = new Date(bookingCreatedAt).getTime();
  if (!Number.isFinite(created)) return true;
  const release = await prisma.siteContent.findUnique({
    where: { key: "phone_released_at_" + normalized }, select: { value: true },
  });
  const timestamp = Number(release?.value || 0);
  return Number.isFinite(timestamp) && timestamp > 0 && created <= timestamp;
}
