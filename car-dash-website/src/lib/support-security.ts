import crypto from "crypto";
import type { NextRequest } from "next/server";

function secret() {
  const configured = (
    process.env.SUPPORT_HASH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    ""
  ).trim();

  if (configured) return configured;
  if (process.env.VERCEL_ENV !== "production") return "car-dash-local-support-only";
  throw new Error("SUPPORT_HASH_SECRET, JWT_SECRET, or NEXTAUTH_SECRET must be configured in production.");
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashVisitor(value: string) {
  return crypto
    .createHmac("sha256", secret())
    .update(value.trim().toLowerCase())
    .digest("hex");
}

// Binds support tickets to a signed-in account without needing a schema change.
// The resulting value is stored in SupportTicket.accessKeyHash.
export function hashSupportAccount(userId: string) {
  return crypto
    .createHmac("sha256", secret())
    .update(`support-account:${userId}`)
    .digest("hex");
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
