import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { normalizeBlockIdentifier } from "@/lib/visitor-security";

function ownerOnly(request: NextRequest) {
  return getAuthFromRequest(request)?.role === "owner";
}

export async function GET(request: NextRequest) {
  if (!ownerOnly(request)) return NextResponse.json({ error: "Owner login required." }, { status: 403 });

  const blocked = await prisma.blockedVisitor.findMany({
    select: { id: true, label: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ blocked });
}

export async function POST(request: NextRequest) {
  if (!ownerOnly(request)) return NextResponse.json({ error: "Owner login required." }, { status: 403 });

  const body = await request.json();
  const identifier = String(body.identifier || "").trim();
  const label = String(body.label || "").trim().slice(0, 120);
  if (!identifier) return NextResponse.json({ error: "Paste an IP address or visitor hash." }, { status: 400 });

  await prisma.blockedVisitor.upsert({
    where: { identifierHash: normalizeBlockIdentifier(identifier) },
    update: { label: label || null },
    create: { identifierHash: normalizeBlockIdentifier(identifier), label: label || null },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!ownerOnly(request)) return NextResponse.json({ error: "Owner login required." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Block ID required." }, { status: 400 });
  await prisma.blockedVisitor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
