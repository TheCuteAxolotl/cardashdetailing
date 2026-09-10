import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const SECURITY_SECRET =
  process.env.VISITOR_HASH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  "car-dash-visitor-security";

export function getVisitorIp(request: NextRequest) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function hashVisitorIdentifier(value: string) {
  return createHmac("sha256", SECURITY_SECRET)
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function getVisitorHash(request: NextRequest) {
  return hashVisitorIdentifier(getVisitorIp(request));
}

export async function isVisitorBlocked(visitorHash: string) {
  const blocked = await prisma.blockedVisitor.findUnique({
    where: { identifierHash: visitorHash },
    select: { id: true },
  });

  return Boolean(blocked);
}

export function normalizeBlockIdentifier(input: string) {
  const value = input.trim();
  if (/^[a-f0-9]{64}$/i.test(value)) return value.toLowerCase();
  return hashVisitorIdentifier(value);
}
