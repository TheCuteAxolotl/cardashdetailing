import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAccount } from "@/lib/permissions";
import {
  ensureJobs,
  jobAccount,
  JobError,
  jobResponseError,
  lockedJob,
  photoMetadata,
  saveJob,
  noStore,
} from "@/lib/jobs";
import {
  canAccessJob,
  isEditable,
  PHOTO_AREAS,
  type JobRow,
} from "@/lib/job-workflow";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  try {
    const account = await jobAccount(req);
    const { id } = await ctx.params;
    await ensureJobs();
    const [job] = await prisma.$queryRaw<
      JobRow[]
    >`SELECT * FROM "DetailJob" WHERE "id"=${id}`;
    if (
      !job ||
      !canAccessJob(isOwnerAccount(account), account.id, job.assigneeId)
    )
      throw new JobError("Job not found.", 404);
    const photoId = req.nextUrl.searchParams.get("photo");
    if (photoId) {
      const [photo] = await prisma.$queryRaw<
        { bytes: Buffer }[]
      >`SELECT "bytes" FROM "DetailJobPhoto" WHERE "id"=${photoId} AND "jobId"=${id}`;
      if (!photo) throw new JobError("Photo not found.", 404);
      return new NextResponse(new Uint8Array(photo.bytes), {
        headers: {
          ...noStore,
          "Content-Type": "image/jpeg",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
      });
    }
    return NextResponse.json(
      { photos: await photoMetadata(prisma, id) },
      { headers: noStore },
    );
  } catch (e) {
    return jobResponseError(e);
  }
}
export async function POST(req: NextRequest, ctx: Context) {
  try {
    const account = await jobAccount(req, true);
    const { id } = await ctx.params;
    if (Number(req.headers.get("content-length") || 0) > 1600000)
      throw new JobError("Photo too large. Maximum 1 MB.", 413);
    const b = await req.json();
    const phase = String(b.phase || "");
    const area = String(b.area || "");
    if (
      !["before", "after"].includes(phase) ||
      !PHOTO_AREAS.some((a) => a === area)
    )
      throw new JobError("Choose a photo phase and area.");
    if (
      typeof b.image !== "string" ||
      b.image.length > 1400000 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(b.image)
    )
      throw new JobError("Use a JPEG photo under 1 MB.");
    const bytes = Buffer.from(b.image.split(",")[1], "base64");
    if (
      bytes.length > 1024 * 1024 ||
      bytes.length < 4 ||
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[bytes.length - 2] !== 255 ||
      bytes[bytes.length - 1] !== 217
    )
      throw new JobError("Invalid JPEG photo.");
    await ensureJobs();
    await prisma.$transaction(async (tx) => {
      const job = await lockedJob(tx, id, account, b.version);
      if (!isEditable(job.state))
        throw new JobError(
          "Photos are locked while awaiting review or approved.",
        );
      const booking = await tx.booking.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!booking || !["confirmed", "completed"].includes(booking.status))
        throw new JobError("Booking is not confirmed for work.");
      if (phase === "after" && job.state === "assigned")
        throw new JobError("Start the job before adding after photos.");
      const photos = await photoMetadata(tx, id);
      if (photos.length >= 60)
        throw new JobError("This job has reached its 60-photo limit.");
      const photoId = randomUUID();
      await tx.$executeRaw`INSERT INTO "DetailJobPhoto" ("id","jobId","phase","area","bytes","uploadedBy") VALUES (${photoId},${id},${phase},${area},${bytes},${account.name})`;
      await saveJob(
        tx,
        job,
        account.name,
        "Uploaded photo",
        `${phase}: ${area}`,
      );
    });
    return NextResponse.json(
      { success: true },
      { status: 201, headers: noStore },
    );
  } catch (e) {
    return jobResponseError(e);
  }
}
