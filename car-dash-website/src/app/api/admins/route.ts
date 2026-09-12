import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";

async function currentOwner(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  return isOwnerAccount(account) ? account : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await currentOwner(request))) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Load admins error:", error);
    return NextResponse.json({ error: "Could not load admin accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await currentOwner(request))) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "Admin").trim() || "Admin";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Admin password must be at least 8 characters" }, { status: 400 });
    }

    if (email === OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "The owner email cannot be used as an admin account" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: "admin",
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json({ error: "Could not create admin account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await currentOwner(request))) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Admin account ID is required" }, { status: 400 });
    }

    const admin = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Admin ${admin.email} deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json({ error: "Could not delete admin account" }, { status: 500 });
  }
}
