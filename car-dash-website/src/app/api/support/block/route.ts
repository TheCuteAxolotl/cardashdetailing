import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { cleanText, normalizeBlockIdentifier } from "@/lib/support-security";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json();
  const identifier = cleanText(body.identifier, 200);
  const reason = cleanText(body.reason, 300);
  if (!identifier) return NextResponse.json({ error: "Paste the IP or visitor hash from Discord." }, { status: 400 });
  const hash = normalizeBlockIdentifier(identifier);
  await prisma.blockedVisitor.upsert({ where: { hash }, update: { reason: reason || null }, create: { hash, reason: reason || null } });
  return NextResponse.json({ success: true, message: "Visitor blocked. The identifier stays hidden from the website UI." });
}
