import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { OWNER_EMAIL } from "@/lib/constants";

const SALT_ROUNDS = 10;
const SECRET_KEY = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "your-secret-key";

export type AuthPayload = {
  id: string;
  email: string;
  role: string;
};

export function getRoleForEmail(email: string) {
  return email === OWNER_EMAIL ? "owner" : "user";
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function createToken(data: AuthPayload): string {
  return jwt.sign(data, SECRET_KEY, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (typeof decoded === "object" && decoded && "id" in decoded && "email" in decoded && "role" in decoded) {
      return decoded as AuthPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  return token || null;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get("auth-token")?.value || null;
}

export function getAuthFromRequest(request: NextRequest): AuthPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }
  const decoded = verifyToken(token);
  return decoded || null;
}
