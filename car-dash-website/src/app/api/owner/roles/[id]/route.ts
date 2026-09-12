import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { sanitizePermissions } from "@/lib/access-control";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";

async function owner(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  return isOwnerAccount(account) ? account : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await owner(request))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    await ensureAccessControlSchema();
    const { id } = await context.params;
    const body = await request.json();
    const name = String(body.name || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 240) || null;
    const permissions = sanitizePermissions(body.permissions);
    if (!name) return NextResponse.json({ error: "Role name is required" }, { status: 400 });

    const role = await prisma.customRole.update({
      where: { id },
      data: { name, description, permissionsJson: JSON.stringify(permissions) },
    });
    return NextResponse.json({ success: true, role: { ...role, permissions } });
  } catch (error: any) {
    console.error("Update custom role error:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "A custom role with that name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Could not update custom role" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await owner(request))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    await ensureAccessControlSchema();
    const { id } = await context.params;
    await prisma.customRole.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Custom role removed. Assigned accounts lost that role immediately." });
  } catch (error) {
    console.error("Delete custom role error:", error);
    return NextResponse.json({ error: "Could not delete custom role" }, { status: 500 });
  }
}
