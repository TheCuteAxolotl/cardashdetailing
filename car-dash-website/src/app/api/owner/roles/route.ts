import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { STAFF_PERMISSIONS, sanitizePermissions } from "@/lib/access-control";
import { getCurrentAccountFromRequest, isOwnerAccount, parseRolePermissions } from "@/lib/permissions";

async function owner(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  return isOwnerAccount(account) ? account : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await owner(request))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    await ensureAccessControlSchema();
    const roles = await prisma.customRole.findMany({
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: parseRolePermissions(role.permissionsJson),
        assignedCount: role._count.assignments,
        createdAt: role.createdAt,
      })),
      permissionCatalog: STAFF_PERMISSIONS,
    });
  } catch (error) {
    console.error("Load custom roles error:", error);
    return NextResponse.json({ error: "Could not load custom roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await owner(request))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    await ensureAccessControlSchema();
    const body = await request.json();
    const name = String(body.name || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 240) || null;
    const permissions = sanitizePermissions(body.permissions);
    if (!name) return NextResponse.json({ error: "Role name is required" }, { status: 400 });

    const role = await prisma.customRole.create({
      data: { name, description, permissionsJson: JSON.stringify(permissions) },
    });
    return NextResponse.json({ success: true, role: { ...role, permissions } }, { status: 201 });
  } catch (error: any) {
    console.error("Create custom role error:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "A custom role with that name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Could not create custom role" }, { status: 500 });
  }
}
