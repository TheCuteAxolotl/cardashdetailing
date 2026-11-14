import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PREFIX = "deleted-record:v1:";
export type DeletedKind = "invoice" | "inventory" | "team" | "booking" | "invoice-edit" | "job-edit" | "photo";
export type DeletedRecord = {
  id: string;
  kind: DeletedKind;
  entityId: string;
  summary: string;
  scope: string;
  snapshot: unknown;
  deletedAt: string;
  deletedById: string;
  deletedByName: string;
  restoredAt: string | null;
  restoredById: string | null;
  restoredByName: string | null;
};

export function deletedKey(id: string) {
  return PREFIX + id;
}

export function parseDeletedRecord(value: string): DeletedRecord | null {
  try {
    const result = JSON.parse(value) as DeletedRecord;
    if (!result || !["invoice", "inventory", "team", "booking","invoice-edit","job-edit","photo"].includes(result.kind)) return null;
    if (!result.id || !result.entityId || !result.deletedById) return null;
    return result;
  } catch { return null; }
}

export async function archiveDeletion(
  tx: Prisma.TransactionClient,
  options: {
    kind: DeletedKind;
    entityId: string;
    summary: string;
    scope: string;
    snapshot: unknown;
    actor: { id: string; name: string };
  },
) {
  const record: DeletedRecord = {
    id: randomUUID(),
    kind: options.kind,
    entityId: options.entityId,
    summary: options.summary.slice(0, 220),
    scope: options.scope,
    snapshot: options.snapshot,
    deletedAt: new Date().toISOString(),
    deletedById: options.actor.id,
    deletedByName: options.actor.name,
    restoredAt: null,
    restoredById: null,
    restoredByName: null,
  };
  await tx.siteContent.create({ data: { key: deletedKey(record.id), value: JSON.stringify(record) } });
  return record;
}

export async function listDeletionHistory() {
  const rows = await prisma.$queryRaw<{value:string}[]>`SELECT ((value::jsonb - 'snapshot')::text) AS value FROM "SiteContent" WHERE key LIKE ${PREFIX+"%"} ORDER BY "updatedAt" DESC`;
  return rows.map((row) => parseDeletedRecord(row.value))
    .filter((record): record is DeletedRecord => Boolean(record))
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
