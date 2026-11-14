import { readTeams } from "@/lib/detailer-teams";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { canAccessJob, type JobRow, type PhotoMeta } from "@/lib/job-workflow";
import {
  getCurrentAccountFromRequest,
  hasStaffPermission,
  isOwnerAccount,
} from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
export class JobError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
let schemaPromise: Promise<void> | null = null;
export function ensureJobs() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = createJobSchema().catch((e) => {
    schemaPromise = null;
    throw e;
  });
  return schemaPromise;
}
async function createJobSchema() {
  await ensureAccessControlSchema();
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "DetailJob" ("id" TEXT PRIMARY KEY REFERENCES "Booking"("id") ON DELETE CASCADE, "assigneeId" TEXT NOT NULL REFERENCES "User"("id"), "state" TEXT NOT NULL DEFAULT 'assigned', "version" INTEGER NOT NULL DEFAULT 1, "data" JSONB NOT NULL, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DetailJob_assignee" ON "DetailJob" ("assigneeId")`;
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "DetailJobPhoto" ("id" TEXT PRIMARY KEY, "jobId" TEXT NOT NULL REFERENCES "DetailJob"("id") ON DELETE CASCADE, "phase" TEXT NOT NULL, "area" TEXT NOT NULL, "bytes" BYTEA NOT NULL, "uploadedBy" TEXT NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DetailJobPhoto_job" ON "DetailJobPhoto" ("jobId")`;
}
export async function jobAccount(req: NextRequest, mutation = false) {
  const account = await getCurrentAccountFromRequest(req);
  if (!account) throw new JobError("Sign in to continue.", 401);
  if (!hasStaffPermission(account, "assignedJobs"))
    throw new JobError("Assigned jobs access required.", 403);
  if (
    mutation &&
    (req.headers.get("sec-fetch-site") === "cross-site" ||
      (req.headers.get("origin") &&
        req.headers.get("origin") !== req.nextUrl.origin))
  )
    throw new JobError("Invalid origin.", 403);
  return account;
}
export function jobResponseError(e: unknown) {
  if (e instanceof JobError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  console.error("Job operation failed", e);
  return NextResponse.json(
    { error: "Could not complete this job operation. Please retry." },
    { status: 500 },
  );
}
export async function hasJobAccess(db: Prisma.TransactionClient, account: Awaited<ReturnType<typeof jobAccount>>, job: JobRow) {
  if (canAccessJob(isOwnerAccount(account), account.id, job.assigneeId)) return true;
  if (!job.data.teamId) return false;
  return (await readTeams(db)).teams.some(team => team.id === job.data.teamId && team.memberIds.includes(account.id));
}
export async function lockedJob(
  tx: Prisma.TransactionClient,
  id: string,
  account: Awaited<ReturnType<typeof jobAccount>>,
  version: unknown,
) {
  const [job] = await tx.$queryRaw<
    JobRow[]
  >`SELECT * FROM "DetailJob" WHERE "id"=${id} FOR UPDATE`;
  if (
    !job ||
    !await hasJobAccess(tx, account, job)
  )
    throw new JobError("Job not found.", 404);
  if (job.version !== version)
    throw new JobError(
      "This job changed. Refresh and review the latest version before saving.",
      409,
    );
  return job;
}
export async function photoMetadata(tx: Prisma.TransactionClient, id: string) {
  return tx.$queryRaw<
    PhotoMeta[]
  >`SELECT "id","phase","area","createdAt","uploadedBy" FROM "DetailJobPhoto" WHERE "jobId"=${id} ORDER BY "createdAt"`;
}
export async function saveJob(
  tx: Prisma.TransactionClient,
  job: JobRow,
  actor: string,
  action: string,
  note?: string,
) {
  job.data.history.push({
    at: new Date().toISOString(),
    actor,
    action,
    ...(note ? { note } : {}),
  });
  await tx.$executeRaw`UPDATE "DetailJob" SET "assigneeId"=${job.assigneeId},"state"=${job.state},"data"=${JSON.stringify(job.data)}::jsonb,"version"="version"+1,"updatedAt"=NOW() WHERE "id"=${job.id}`;
}
export const noStore = { "Cache-Control": "private, no-store" };
