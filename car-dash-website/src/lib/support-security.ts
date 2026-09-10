import crypto from "crypto";
import type { NextRequest } from "next/server";

function secret() {
  return (
    process.env.SUPPORT_HASH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "car-dash-support-fallback"
  );
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashVisitor(value: string) {
  return crypto.createHmac("sha256", secret()).update(value.trim().toLowerCase()).digest("hex");
}

export function hashAccessKey(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createAccessKey() {
  return crypto.randomBytes(24).toString("hex");
}

export function normalizeBlockIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (/^[a-f0-9]{64}$/.test(value)) return value;
  return hashVisitor(value);
}

export function cleanText(value: unknown, max = 1200) {
  return String(value ?? "").trim().slice(0, max);
}
