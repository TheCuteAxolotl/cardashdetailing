import { prisma } from "@/lib/prisma";

let schemaReady: Promise<void> | null = null;

export function ensureCallSystemSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlockedCaller" (
          "id" TEXT NOT NULL,
          "phoneNumber" TEXT NOT NULL,
          "reason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BlockedCaller_pkey" PRIMARY KEY ("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "BlockedCaller_phoneNumber_key"
        ON "BlockedCaller"("phoneNumber")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BlockedCaller_createdAt_idx"
        ON "BlockedCaller"("createdAt")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CallLog" (
          "id" TEXT NOT NULL,
          "callSid" TEXT NOT NULL,
          "fromPhone" TEXT NOT NULL,
          "toPhone" TEXT,
          "status" TEXT NOT NULL DEFAULT 'received',
          "blocked" BOOLEAN NOT NULL DEFAULT false,
          "dialCallSid" TEXT,
          "durationSeconds" INTEGER,
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "endedAt" TIMESTAMP(3),
          CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "CallLog_callSid_key"
        ON "CallLog"("callSid")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "CallLog_startedAt_idx"
        ON "CallLog"("startedAt")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "CallLog_fromPhone_startedAt_idx"
        ON "CallLog"("fromPhone", "startedAt")
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
