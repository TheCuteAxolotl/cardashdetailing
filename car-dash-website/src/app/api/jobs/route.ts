import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPermissionSnapshotForUser,
  resolvePermissionSnapshot,
  isOwnerAccount,
} from "@/lib/permissions";
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
  missingEvidence,
  emptyJobData,
  PHOTO_AREAS,
  JOB_CHECKS,
  isEditable,
  transitionError,
  type JobRow,
} from "@/lib/job-workflow";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const account = await jobAccount(req);
    const owner = isOwnerAccount(account);
    await ensureJobs();
    const jobs = owner
      ? await prisma.$queryRaw<
          JobRow[]
        >`SELECT * FROM "DetailJob" ORDER BY "updatedAt" DESC`
      : await prisma.$queryRaw<
          JobRow[]
        >`SELECT * FROM "DetailJob" WHERE "assigneeId"=${account.id} ORDER BY "updatedAt" DESC`;
    const bookings = await prisma.booking.findMany({
      where: owner ? {} : { id: { in: jobs.map((j) => j.id) } },
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        vehicleYear: true,
        vehicleMake: true,
        vehicleModel: true,
        vehicleTrim: true,
        preferredDate: true,
        preferredTime: true,
        status: true,
        notes: true,
      },
      orderBy: { preferredDate: "asc" },
    });
    const users = owner
      ? await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            customRoleAssignments: { include: { role: true } },
            permissionOverrides: true,
          },
        })
      : [];
    const employees = (
      await Promise.all(
        users.map(async (u) => ({
          ...u,
          permissions: resolvePermissionSnapshot({
            email: u.email,
            role: u.role,
            assignments: u.customRoleAssignments,
            overrides: u.permissionOverrides,
          }).permissions,
        })),
      )
    )
      .filter((u) => u.permissions.includes("assignedJobs"))
      .map(({ id, name, email, role }) => ({ id, name, email, role }));
    const photoRows = await prisma.$queryRaw<
      Array<{ jobId: string; phase: string; area: string }>
    >`SELECT p."jobId",p."phase",p."area" FROM "DetailJobPhoto" p JOIN "DetailJob" j ON j."id"=p."jobId" WHERE ${owner} OR j."assigneeId"=${account.id}`;
    return NextResponse.json(
      {
        owner,
        employeeId: account.id,
        employees,
        jobs: jobs.map((j) => ({
          ...j,
          missingPhotos: missingEvidence(
            j.data.requiredAreas,
            photoRows.filter((p) => p.jobId === j.id),
          ),
          assigneeName:
            users.find((u) => u.id === j.assigneeId)?.name ||
            (j.assigneeId === account.id
              ? account.name
              : "Former / unavailable employee"),
          assigneeActive: owner
            ? employees.some((u) => u.id === j.assigneeId)
            : true,
        })),
        bookings: bookings.map(({ notes, ...b }) => ({
          ...b,
          address: notes?.match(/^Service address: (.+)$/m)?.[1] || "",
        })),
        asOf: new Date().toISOString(),
      },
      { headers: noStore },
    );
  } catch (e) {
    return jobResponseError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const account = await jobAccount(req, true);
    if (!isOwnerAccount(account))
      throw new JobError("Owner access required.", 403);
    const b = await req.json();
    const id = String(b.bookingId || "");
    const assigneeId = String(b.assigneeId || "");
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.status !== "confirmed")
      throw new JobError(
        "Only confirmed bookings can be assigned. Confirm the booking separately first.",
      );
    const user = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (
      !user ||
      !(await getPermissionSnapshotForUser(user)).permissions.includes(
        "assignedJobs",
      )
    )
      throw new JobError("Choose an employee with Assigned jobs access.");
    const areas = Array.isArray(b.requiredAreas)
      ? PHOTO_AREAS.filter((a) => b.requiredAreas.includes(a))
      : [];
    if (!areas.length)
      throw new JobError("Choose at least one required photo area.");
    const data = emptyJobData();
    data.instructions = String(b.instructions || "")
      .trim()
      .slice(0, 5000);
    data.requiredAreas = areas;
    data.history.push({
      at: new Date().toISOString(),
      actor: account.name,
      action: "Assigned job",
      note: user.name,
    });
    await ensureJobs();
    const count =
      await prisma.$executeRaw`INSERT INTO "DetailJob" ("id","assigneeId","data") VALUES (${id},${assigneeId},${JSON.stringify(data)}::jsonb) ON CONFLICT ("id") DO NOTHING`;
    if (!count)
      throw new JobError(
        "This booking already has a job. Refresh to open it.",
        409,
      );
    return NextResponse.json(
      { success: true },
      { status: 201, headers: noStore },
    );
  } catch (e) {
    return jobResponseError(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const account = await jobAccount(req, true);
    const owner = isOwnerAccount(account);
    const b = await req.json();
    await ensureJobs();
    await prisma.$transaction(async (tx) => {
      const job = await lockedJob(tx, String(b.id || ""), account, b.version);
      const booking = await tx.booking.findUnique({
        where: { id: job.id },
        select: { status: true },
      });
      if (!booking || !["confirmed", "completed"].includes(booking.status))
        throw new JobError(
          "Work is blocked while the booking is cancelled or awaiting confirmation.",
        );
      const action = String(b.action || "");
      if (action === "save") {
        if (!isEditable(job.state))
          throw new JobError(
            "Submitted and approved jobs are locked. Return or reopen the job first.",
          );
        job.data.damageNotes = String(b.damageNotes || "")
          .trim()
          .slice(0, 5000);
        job.data.workNotes = String(b.workNotes || "")
          .trim()
          .slice(0, 5000);
        job.data.checks = Array.isArray(b.checks)
          ? JOB_CHECKS.filter((c) => b.checks.includes(c))
          : [];
        if (owner) {
          const targetId = String(b.assigneeId || job.assigneeId);
          if (targetId !== job.assigneeId) {
            const user = await tx.user.findUnique({ where: { id: targetId } });
            if (
              !user ||
              !(await getPermissionSnapshotForUser(user)).permissions.includes(
                "assignedJobs",
              )
            )
              throw new JobError("Choose an active detailer.");
            job.data.history.push({
              at: new Date().toISOString(),
              actor: account.name,
              action: "Reassigned job",
              note: user.name,
            });
            job.assigneeId = targetId;
          }
          job.data.instructions = String(
            b.instructions ?? job.data.instructions,
          )
            .trim()
            .slice(0, 5000);
        }
        await saveJob(
          tx,
          job,
          account.name,
          "Updated work notes and checklist",
          JSON.stringify({
            damageNotes: job.data.damageNotes,
            workNotes: job.data.workNotes,
            checks: job.data.checks,
          }),
        );
      } else if (action === "manage") {
        if (!owner) throw new JobError("Only the owner can assign work.", 403);
        if (!isEditable(job.state))
          throw new JobError("Return or reopen the job before reassigning it.");
        const user = await tx.user.findUnique({
          where: { id: String(b.assigneeId || "") },
        });
        if (
          !user ||
          !(await getPermissionSnapshotForUser(user)).permissions.includes(
            "assignedJobs",
          )
        )
          throw new JobError("Choose an active detailer.");
        job.assigneeId = user.id;
        job.data.instructions = String(b.instructions || "")
          .trim()
          .slice(0, 5000);
        await saveJob(
          tx,
          job,
          account.name,
          "Updated assignment / instructions",
          user.name,
        );
      } else {
        const error = transitionError(
          job.state,
          action,
          owner,
          job.data,
          await photoMetadata(tx, job.id),
        );
        if (error) throw new JobError(error);
        const feedback = String(b.feedback || "")
          .trim()
          .slice(0, 5000);
        if ((action === "return" || action === "reopen") && !feedback)
          throw new JobError("Describe what needs attention.");
        if (action === "start") job.state = "in_progress";
        if (action === "submit") job.state = "awaiting_review";
        if (action === "approve") job.state = "approved";
        if (action === "return" || action === "reopen") {
          job.state = "needs_touch_up";
          job.data.checks = [];
          job.data.feedback = feedback;
        }
        await saveJob(tx, job, account.name, action, feedback);
      }
    });
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (e) {
    return jobResponseError(e);
  }
}
