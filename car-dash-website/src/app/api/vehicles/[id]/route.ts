import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await context.params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: auth.id }, select: { id: true } });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
