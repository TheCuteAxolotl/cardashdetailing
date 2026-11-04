import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function newBookingReference() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  // Rejection sampling avoids modulo bias while excluding easily confused characters.
  let code = "";
  for (const byte of bytes) {
    if (byte < 248) code += alphabet[byte % alphabet.length];
  }
  while (code.length < 8) {
    const byte = randomBytes(1)[0];
    if (byte < 248) code += alphabet[byte % alphabet.length];
  }
  return `CD-${code}`;
}
export function normalizeBookingReference(value: string) {
  return value.trim().toUpperCase();
}

/** Keep internal relation IDs intact. Two unique keys reserve each public number atomically. */
export async function ensureBookingReference(bookingId: string): Promise<string> {
  const key = `booking-reference:${bookingId}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const saved = await prisma.siteContent.findUnique({ where: { key } });
    if (saved) return saved.value;
    const receipt = await prisma.siteContent.findUnique({ where: { key: `invoice:booking-paid-${bookingId}` } });
    const legacy = receipt ? String(JSON.parse(receipt.value).invoiceNumber || "").trim() : "";
    const number = legacy || newBookingReference();
    try {
      await prisma.$transaction([
        prisma.siteContent.create({ data: { key, value: number } }),
        prisma.siteContent.create({ data: { key: `booking-lookup:${normalizeBookingReference(number)}`, value: bookingId } }),
      ]);
      return number;
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
      const winner = await prisma.siteContent.findUnique({ where: { key } });
      if (winner) return winner.value;
      if (legacy) throw new Error("This legacy invoice number is duplicated. Resolve it in Invoices before issuing a certificate.");
    }
  }
  throw new Error("Could not reserve a booking number. Please retry.");
}
