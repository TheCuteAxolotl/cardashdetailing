import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
export const BUSINESS_GMAIL = "cardashdetailing.il@gmail.com";
function key() {
  const secret = process.env.EMAIL_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 24) throw new Error("Email encryption is not configured.");
  return createHash("sha256").update(`car-dash-email:${secret}`).digest();
}
export function encryptEmailSecret(value: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}
export function decryptEmailSecret(value: string) {
  const [iv, tag, data] = value.split(".");
  const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  cipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([cipher.update(Buffer.from(data, "base64")), cipher.final()]).toString("utf8");
}
export function secretHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function matchesSecret(value: string, hash: string) {
  const actual = Buffer.from(secretHash(value)), expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function emailRecipient(value: unknown) {
  const email = String(value || "").trim();
  if (email.length > 254 || !/^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/.test(email)) throw new Error("Enter one valid recipient email address.");
  return email;
}
