import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const service = await prisma.service.findUnique({ where: { id } });
  return service ? NextResponse.json(service) : NextResponse.json({ error: "Service not found" }, { status: 404 });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner login required" }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json();
  const startingPrice = body.startingPrice === "" || body.startingPrice == null ? null : Number(body.startingPrice);
  const maxPrice = body.maxPrice === "" || body.maxPrice == null ? null : Number(body.maxPrice);
  const service = await prisma.service.update({ where: { id }, data: {
    title: String(body.title || "").trim(), description: String(body.description || "").trim(),
    pricingType: String(body.pricingType || "fixed"), price: Number(body.price || 0),
    startingPrice: Number.isFinite(startingPrice) ? startingPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    category: String(body.category || "Car Detailing").trim(), subcategory: String(body.subcategory || "General").trim(),
    active: body.active !== false, sortOrder: Number(body.sortOrder || 0),
  }});
  return NextResponse.json(service);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner login required" }, { status: 403 });
  const { id } = await context.params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ message: "Service deleted" });
}
