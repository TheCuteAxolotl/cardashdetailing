import { prisma } from "@/lib/prisma";
import {
  DiscountCode,
  extractDiscountCodeFromBookingNotes,
  getDiscountUsageMarker,
  isDiscountExpired,
} from "@/lib/booking-pricing";

export type DiscountAvailability = {
  valid: boolean;
  message?: string;
  usageCount: number;
};

function comparablePhone(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function getDiscountUsageCounts(codes: string[]) {
  const normalizedCodes = [...new Set(codes.filter(Boolean))];
  const counts: Record<string, number> = Object.fromEntries(normalizedCodes.map((code) => [code, 0]));
  if (normalizedCodes.length === 0) return counts;

  const bookings = await prisma.booking.findMany({
    where: { notes: { contains: "Discount: " } },
    select: { notes: true },
  });

  for (const booking of bookings) {
    const code = extractDiscountCodeFromBookingNotes(booking.notes);
    if (code && Object.prototype.hasOwnProperty.call(counts, code)) counts[code] += 1;
  }

  return counts;
}

export async function getDiscountUsageCount(code: string) {
  return prisma.booking.count({
    where: { notes: { contains: getDiscountUsageMarker(code) } },
  });
}

export async function checkDiscountAvailability(
  discount: DiscountCode,
  customer?: { userId?: string | null; email?: string | null; phone?: string | null }
): Promise<DiscountAvailability> {
  if (!discount.active) {
    return { valid: false, message: "That discount code is not active.", usageCount: 0 };
  }

  if (isDiscountExpired(discount)) {
    return { valid: false, message: "That discount code has expired.", usageCount: 0 };
  }

  const redemptions = await prisma.booking.findMany({
    where: { notes: { contains: getDiscountUsageMarker(discount.code) } },
    select: { userId: true, customerEmail: true, customerPhone: true },
  });
  const usageCount = redemptions.length;

  if (discount.usageLimit !== null && usageCount >= discount.usageLimit) {
    return { valid: false, message: "That discount code has reached its usage limit.", usageCount };
  }

  if (discount.onePerCustomer) {
    const userId = customer?.userId || null;
    const email = customer?.email?.trim().toLowerCase() || "";
    const phone = comparablePhone(customer?.phone);
    if (!userId && !email && !phone) {
      return { valid: false, message: "Enter your email or phone number before applying this one-time discount code.", usageCount };
    }

    const alreadyUsed = redemptions.some((redemption) => {
      if (userId && redemption.userId === userId) return true;
      if (email && redemption.customerEmail.trim().toLowerCase() === email) return true;
      const previousPhone = comparablePhone(redemption.customerPhone);
      return Boolean(phone && previousPhone && phone === previousPhone);
    });

    if (alreadyUsed) {
      return { valid: false, message: "This discount code can only be used once per customer.", usageCount };
    }
  }

  return { valid: true, usageCount };
}
