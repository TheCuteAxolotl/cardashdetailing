import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { isStaffPermission, sanitizePermissions } from "@/lib/access-control";
import { getCurrentAccountFromRequest, getPermissionSnapshotForUser, isOwnerAccount } from "@/lib/permissions";

async function requireOwner(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  return isOwnerAccount(account) ? account : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner(request))) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    await ensureAccessControlSchema();
    const { id } = await context.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const protectedOwner = existing.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const body = await request.json();

    const data: { name?: string; email?: string; role?: string; password?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name || "").trim().slice(0, 120);
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      data.name = name;
    }

    if (body.email !== undefined) {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
      if (protectedOwner && email !== OWNER_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: "The owner email cannot be changed here" }, { status: 400 });
      }
      data.email = email;
    }

    if (body.role !== undefined) {
      const role = String(body.role);
      if (protectedOwner) {
        if (role !== "owner") return NextResponse.json({ error: "The owner role cannot be removed" }, { status: 400 });
      } else {
        if (!['user', 'admin'].includes(role)) return NextResponse.json({ error: "Role must be user or admin" }, { status: 400 });
        data.role = role;
      }
    }

    if (body.newPassword) {
      const password = String(body.newPassword);
      if (password.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      data.password = await hashPassword(password);
    }

    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id }, data });
    }

    if (!protectedOwner && Array.isArray(body.customRoleIds)) {
      const roleIds: string[] = Array.from(new Set<string>(body.customRoleIds.map((value: unknown) => String(value)).filter(Boolean)));
      const validRoles = roleIds.length
        ? await prisma.customRole.findMany({ where: { id: { in: roleIds } }, select: { id: true } })
        : [];
      const validIds = new Set(validRoles.map((role) => role.id));
      const assignments = roleIds.filter((roleId) => validIds.has(roleId));

      await prisma.customRoleAssignment.deleteMany({ where: { userId: id } });
      if (assignments.length) {
        await prisma.customRoleAssignment.createMany({
          data: assignments.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });
      }
    }

    if (!protectedOwner && body.overrides && typeof body.overrides === "object") {
      const rows = Object.entries(body.overrides)
        .filter(([permission]) => isStaffPermission(permission))
        .map(([permission, mode]) => ({ permission, mode: String(mode) }))
        .filter((item) => item.mode === "allow" || item.mode === "deny");

      await prisma.userPermissionOverride.deleteMany({ where: { userId: id } });
      if (rows.length) {
        await prisma.userPermissionOverride.createMany({
          data: rows.map((item) => ({ userId: id, permission: item.permission, allowed: item.mode === "allow" })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!updated) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    const access = await getPermissionSnapshotForUser(updated);

    return NextResponse.json({
      success: true,
      user: { ...updated, role: access.role },
      permissions: sanitizePermissions(access.permissions),
      customRoles: access.customRoles,
      staffAccess: access.staffAccess,
    });
  } catch (error: any) {
    console.error("Update account error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That email is already used by another account" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner(request))) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "The owner account cannot be deleted" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: `${user.name || user.email} was deleted.` });
  } catch (error) {
    console.error("Delete account from owner directory error:", error);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
