import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const { id } = await context.params;
  await prisma.warranty.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
