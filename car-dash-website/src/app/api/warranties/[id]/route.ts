import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!hasStaffPermission(auth, "warranties")) return NextResponse.json({ error: "Warranty dashboard access required" }, { status: 403 });
  const { id } = await context.params;
  await prisma.warranty.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
