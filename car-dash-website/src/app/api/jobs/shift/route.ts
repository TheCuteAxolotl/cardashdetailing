import { NextRequest, NextResponse } from "next/server";
import { jobAccount, jobResponseError, JobError } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const account = await jobAccount(req);
    const active = await prisma.siteContent.findUnique({ where: { key: "shift:active:" + account.id } });
    return NextResponse.json({ start: active?.value ?? null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return jobResponseError(error); }
}

export async function POST(req: NextRequest) {
  try {
    const account = await jobAccount(req, true);
    const body = await req.json();
    if (body.action !== "in" && body.action !== "out") throw new JobError("Unknown clock action.");
    const key = "shift:active:" + account.id;
    const start = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${account.id} FOR UPDATE`;
      const active = await tx.siteContent.findUnique({ where: { key } });
      const now = new Date().toISOString();
      if (body.action === "in") {
        if (active) return active.value;
        await tx.siteContent.create({ data: { key, value: now } });
        return now;
      }
      if (!active) return null;
      if (active.value !== body.start) throw new JobError("Your shift changed. Refresh before clocking out.", 409);
      await tx.siteContent.create({ data: {
        key: "shift:closed:" + active.id,
        value: JSON.stringify({ userId: account.id, start: active.value, end: now }),
      } });
      await tx.siteContent.delete({ where: { key } });
      return null;
    });
    return NextResponse.json({ start });
  } catch (error) { return jobResponseError(error); }
}
