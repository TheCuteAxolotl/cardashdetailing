import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const STANDARD_MAINTENANCE_PLAN = {
  id: "standard-ceramic-maintenance",
  name: "Ceramic Maintenance",
  description: "Monthly ceramic maintenance with Car Dash Detailing.",
  amountCents: 6000,
  interval: "month" as const,
};

export type MaintenanceOffer = {
  id: string;
  shareToken: string;
  name: string;
  description: string;
  amountCents: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceSubscription = {
  id: string;
  offerId: string | null;
  manageToken: string;
  planName: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stripeCheckoutSessionId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

let schemaReady: Promise<void> | null = null;

export function ensureMaintenanceSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MaintenanceOffer" (
          "id" TEXT NOT NULL,
          "shareToken" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT NOT NULL DEFAULT '',
          "amountCents" INTEGER NOT NULL,
          "customerName" TEXT,
          "customerEmail" TEXT,
          "customerPhone" TEXT,
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MaintenanceOffer_pkey" PRIMARY KEY ("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceOffer_shareToken_key"
        ON "MaintenanceOffer"("shareToken")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MaintenanceSubscription" (
          "id" TEXT NOT NULL,
          "offerId" TEXT,
          "manageToken" TEXT NOT NULL,
          "planName" TEXT NOT NULL,
          "amountCents" INTEGER NOT NULL,
          "customerName" TEXT NOT NULL,
          "customerEmail" TEXT NOT NULL,
          "customerPhone" TEXT,
          "stripeCheckoutSessionId" TEXT,
          "stripeCustomerId" TEXT,
          "stripeSubscriptionId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
          "currentPeriodEnd" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MaintenanceSubscription_pkey" PRIMARY KEY ("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceSubscription_manageToken_key"
        ON "MaintenanceSubscription"("manageToken")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceSubscription_stripeSubscriptionId_key"
        ON "MaintenanceSubscription"("stripeSubscriptionId")
        WHERE "stripeSubscriptionId" IS NOT NULL
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaintenanceSubscription_offerId_idx"
        ON "MaintenanceSubscription"("offerId")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaintenanceSubscription_customerEmail_idx"
        ON "MaintenanceSubscription"("customerEmail")
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

function token(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function mapOffer(row: any): MaintenanceOffer {
  return {
    id: String(row.id),
    shareToken: String(row.shareToken),
    name: String(row.name),
    description: String(row.description || ""),
    amountCents: Number(row.amountCents || 0),
    customerName: row.customerName ? String(row.customerName) : null,
    customerEmail: row.customerEmail ? String(row.customerEmail) : null,
    customerPhone: row.customerPhone ? String(row.customerPhone) : null,
    active: Boolean(row.active),
    createdAt: serializeDate(row.createdAt) || new Date().toISOString(),
    updatedAt: serializeDate(row.updatedAt) || new Date().toISOString(),
  };
}

function mapSubscription(row: any): MaintenanceSubscription {
  return {
    id: String(row.id),
    offerId: row.offerId ? String(row.offerId) : null,
    manageToken: String(row.manageToken),
    planName: String(row.planName),
    amountCents: Number(row.amountCents || 0),
    customerName: String(row.customerName || ""),
    customerEmail: String(row.customerEmail || ""),
    customerPhone: row.customerPhone ? String(row.customerPhone) : null,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId ? String(row.stripeCheckoutSessionId) : null,
    stripeCustomerId: row.stripeCustomerId ? String(row.stripeCustomerId) : null,
    stripeSubscriptionId: row.stripeSubscriptionId ? String(row.stripeSubscriptionId) : null,
    status: String(row.status || "pending"),
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    currentPeriodEnd: serializeDate(row.currentPeriodEnd),
    createdAt: serializeDate(row.createdAt) || new Date().toISOString(),
    updatedAt: serializeDate(row.updatedAt) || new Date().toISOString(),
  };
}

export async function createMaintenanceOffer(input: {
  name: string;
  description?: string;
  amountCents: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
}) {
  await ensureMaintenanceSchema();
  const id = randomUUID();
  const shareToken = token();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO "MaintenanceOffer"
      ("id","shareToken","name","description","amountCents","customerName","customerEmail","customerPhone","active","createdAt","updatedAt")
    VALUES
      (${id},${shareToken},${input.name},${input.description || ""},${input.amountCents},
       ${input.customerName || null},${input.customerEmail || null},${input.customerPhone || null},
       TRUE,${now},${now})
  `;

  return getMaintenanceOfferById(id);
}

export async function getMaintenanceOfferById(id: string) {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceOffer" WHERE "id" = ${id} LIMIT 1
  `;
  return rows[0] ? mapOffer(rows[0]) : null;
}

export async function getMaintenanceOfferByToken(shareToken: string) {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceOffer" WHERE "shareToken" = ${shareToken} LIMIT 1
  `;
  return rows[0] ? mapOffer(rows[0]) : null;
}

export async function listMaintenanceOffers() {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceOffer" ORDER BY "createdAt" DESC
  `;
  return rows.map(mapOffer);
}

export async function setMaintenanceOfferActive(id: string, active: boolean) {
  await ensureMaintenanceSchema();
  await prisma.$executeRaw`
    UPDATE "MaintenanceOffer"
    SET "active" = ${active}, "updatedAt" = ${new Date()}
    WHERE "id" = ${id}
  `;
  return getMaintenanceOfferById(id);
}

export async function createPendingMaintenanceSubscription(input: {
  offerId?: string | null;
  planName: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}) {
  await ensureMaintenanceSchema();
  const id = randomUUID();
  const manageToken = token(32);
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO "MaintenanceSubscription"
      ("id","offerId","manageToken","planName","amountCents","customerName","customerEmail","customerPhone",
       "status","cancelAtPeriodEnd","createdAt","updatedAt")
    VALUES
      (${id},${input.offerId || null},${manageToken},${input.planName},${input.amountCents},
       ${input.customerName},${input.customerEmail.toLowerCase()},${input.customerPhone || null},
       'pending',FALSE,${now},${now})
  `;

  return getMaintenanceSubscriptionById(id);
}

export async function updateMaintenanceCheckoutSession(id: string, sessionId: string) {
  await ensureMaintenanceSchema();
  await prisma.$executeRaw`
    UPDATE "MaintenanceSubscription"
    SET "stripeCheckoutSessionId" = ${sessionId}, "updatedAt" = ${new Date()}
    WHERE "id" = ${id}
  `;
}

export async function getMaintenanceSubscriptionById(id: string) {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceSubscription" WHERE "id" = ${id} LIMIT 1
  `;
  return rows[0] ? mapSubscription(rows[0]) : null;
}

export async function getMaintenanceSubscriptionByManageToken(manageToken: string) {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceSubscription" WHERE "manageToken" = ${manageToken} LIMIT 1
  `;
  return rows[0] ? mapSubscription(rows[0]) : null;
}

export async function getMaintenanceSubscriptionByStripeId(stripeSubscriptionId: string) {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceSubscription"
    WHERE "stripeSubscriptionId" = ${stripeSubscriptionId}
    LIMIT 1
  `;
  return rows[0] ? mapSubscription(rows[0]) : null;
}

export async function listMaintenanceSubscriptions() {
  await ensureMaintenanceSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceSubscription" ORDER BY "createdAt" DESC
  `;
  return rows.map(mapSubscription);
}

export async function listMaintenanceSubscriptionsForEmail(email: string) {
  await ensureMaintenanceSchema();
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "MaintenanceSubscription"
    WHERE LOWER("customerEmail") = ${normalized}
    ORDER BY "createdAt" DESC
  `;
  return rows.map(mapSubscription);
}

export async function syncMaintenanceSubscription(input: {
  id: string;
  stripeCheckoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | Date | null;
}) {
  await ensureMaintenanceSchema();
  const currentPeriodEnd =
    typeof input.currentPeriodEnd === "number"
      ? new Date(input.currentPeriodEnd * 1000)
      : input.currentPeriodEnd || null;

  const existing = await getMaintenanceSubscriptionById(input.id);
  if (!existing) return null;

  await prisma.$executeRaw`
    UPDATE "MaintenanceSubscription"
    SET
      "stripeCheckoutSessionId" = ${input.stripeCheckoutSessionId ?? existing.stripeCheckoutSessionId},
      "stripeCustomerId" = ${input.stripeCustomerId ?? existing.stripeCustomerId},
      "stripeSubscriptionId" = ${input.stripeSubscriptionId ?? existing.stripeSubscriptionId},
      "status" = ${input.status ?? existing.status},
      "cancelAtPeriodEnd" = ${input.cancelAtPeriodEnd ?? existing.cancelAtPeriodEnd},
      "currentPeriodEnd" = ${currentPeriodEnd ?? (existing.currentPeriodEnd ? new Date(existing.currentPeriodEnd) : null)},
      "updatedAt" = ${new Date()}
    WHERE "id" = ${input.id}
  `;

  return getMaintenanceSubscriptionById(input.id);
}
