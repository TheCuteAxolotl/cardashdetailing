import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isOwnerAccount } from "@/lib/permissions";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { jobAccount, JobError, jobResponseError } from "@/lib/jobs";
export async function POST(req: NextRequest) {
  try {
    const actor = await jobAccount(req, true);
    if (!isOwnerAccount(actor))
      throw new JobError("Owner access required.", 403);
    const b = await req.json();
    const name = String(b.name || "")
      .trim()
      .slice(0, 120);
    const email = String(b.email || "")
      .trim()
      .toLowerCase();
    const password = String(b.password || "");
    if (
      !name ||
      email.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 12 ||
      password.length > 128
    )
      throw new JobError(
        "Enter a name, valid email, and a password of 12–128 characters.",
      );
    if (await prisma.user.findUnique({ where: { email } }))
      throw new JobError(
        "This account already exists. Use Staff & accounts to give it Assigned jobs permission without creating a duplicate.",
        409,
      );
    await ensureAccessControlSchema();
    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "user",
        permissionOverrides: {
          create: [
            { permission: "assignedJobs", allowed: true },
            { permission: "inventory", allowed: true },
            { permission: "staffGuide", allowed: true },
          ],
        },
      },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return jobResponseError(e);
  }
}
