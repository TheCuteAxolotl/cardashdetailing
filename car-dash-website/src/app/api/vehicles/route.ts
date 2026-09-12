import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const vehicles = await prisma.vehicle.findMany({ where: { userId: auth.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(vehicles);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await request.json();
  const year = String(body.year || "").trim();
  const make = String(body.make || "").trim();
  const model = String(body.model || "").trim();
  if (!year || !make || !model) return NextResponse.json({ error: "Year, make, and model are required." }, { status: 400 });
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: auth.id,
      nickname: String(body.nickname || "").trim() || null,
      year, make, model,
      trim: String(body.trim || "").trim() || null,
      vehicleType: String(body.vehicleType || "Sedan").trim(),
      color: String(body.color || "").trim() || null,
    },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
