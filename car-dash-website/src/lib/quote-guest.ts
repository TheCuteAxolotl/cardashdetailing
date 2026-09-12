import { prisma } from "@/lib/prisma";

let setupPromise: Promise<void> | null = null;

export function ensureGuestQuoteSupport() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ALTER COLUMN "userId" DROP NOT NULL');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ADD COLUMN IF NOT EXISTS "guestName" TEXT');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ADD COLUMN IF NOT EXISTS "guestVehicle" TEXT');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteThread" ADD COLUMN IF NOT EXISTS "guestVisitorHash" TEXT');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "QuoteThread_guestEmail_idx" ON "QuoteThread"("guestEmail")');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "QuoteThread_guestVisitorHash_idx" ON "QuoteThread"("guestVisitorHash")');
      await prisma.$executeRawUnsafe('ALTER TABLE "QuoteMessage" ADD COLUMN IF NOT EXISTS "externalSid" TEXT');
      await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "QuoteMessage_externalSid_key" ON "QuoteMessage"("externalSid")');
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase().slice(0, 254);
}
