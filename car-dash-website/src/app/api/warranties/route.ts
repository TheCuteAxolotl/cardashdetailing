import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const warranties = await prisma.warranty.findMany({ where: hasStaffPermission(auth, "warranties") ? {} : { userId: auth.id }, include: { vehicle: true, user: { select: { name: true, email: true } } }, orderBy: { installedAt: "desc" } });
  return NextResponse.json(warranties);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!hasStaffPermission(auth, "warranties")) return NextResponse.json({ error: "Warranty dashboard access required" }, { status: 403 });
  const body = await request.json();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: String(body.vehicleId || "") } });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  const durationYears = Math.max(1, Number(body.durationYears || 1));
  const installedAt = new Date(String(body.installedAt));
  const expiresAt = new Date(installedAt); expiresAt.setFullYear(expiresAt.getFullYear() + durationYears);
  const warranty = await prisma.warranty.create({ data: { userId: vehicle.userId, vehicleId: vehicle.id, coatingName: String(body.coatingName || "Ceramic Coating").trim(), durationYears, installedAt, expiresAt, installerNotes: String(body.installerNotes || "").trim() || null } });
  return NextResponse.json(warranty, { status: 201 });
}
