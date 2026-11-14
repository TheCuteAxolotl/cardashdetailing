import {archiveDeletion} from "@/lib/deletion-history";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAccount } from "@/lib/permissions";
import {
  hasJobAccess,
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

  isEditable,
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
      !await hasJobAccess(prisma, account, job)
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
      {
        photos: await photoMetadata(prisma, id),
        state: job.state,
        startedAt: job.data.startedAt || job.data.history.find((entry) => entry.action === "start")?.at || null,
        finishedAt: job.data.finishedAt === null ? null : job.data.finishedAt || [...job.data.history].reverse().find((entry) => entry.action === "submit")?.at || null,
      },
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
    // Keep legacy photo fields for existing records, but never require a category.
    const phase = "general";
    const area = "General";
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
    const nextVersion = await prisma.$transaction(async (tx) => {
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
        "Photo added to job gallery",
      );
      return job.version + 1;
    });
    return NextResponse.json(
      { success: true, version: nextVersion },
      { status: 201, headers: noStore },
    );
  } catch (e) {
    return jobResponseError(e);
  }
}

export async function DELETE(req:NextRequest,ctx:Context) {
  try {
    const actor=await jobAccount(req,true);
    if(!isOwnerAccount(actor))throw new JobError("Owner access required.",403);
    const {id}=await ctx.params;
    const b=await req.json();
    await prisma.$transaction(async tx=>{
      const job=await lockedJob(tx,id,actor,b.version);
      const photo=await tx.detailJobPhoto.findFirst({where:{id:String(b.photoId),jobId:id}});
      if(!photo)throw new JobError("Photo unavailable.",404);
      await archiveDeletion(tx,{kind:"photo",entityId:photo.id,actor,scope:id,summary:"Removed service photo",snapshot:{...photo,bytes:Buffer.from(photo.bytes).toString("base64")}});
      await tx.detailJobPhoto.delete({where:{id:photo.id}});
      await saveJob(tx,job,actor.name,"Removed photo",photo.id);
    });
    return NextResponse.json({ok:true});
  }catch(e){return jobResponseError(e);}
}
