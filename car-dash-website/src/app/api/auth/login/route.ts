import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, hashPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  isLikelyDatabaseError,
  databaseUnavailableResponseMessage,
} from "@/lib/database-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configuredOwnerEmail() {
  return (
    process.env.OWNER_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
}

function secureTextEqual(a: string, b: string) {
  const aDigest = createHash("sha256").update(a).digest();
  const bDigest = createHash("sha256").update(b).digest();
  return timingSafeEqual(aDigest, bDigest);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ownerEmail = configuredOwnerEmail();
    const isOwnerLogin = Boolean(ownerEmail && normalizedEmail === ownerEmail);
    const ownerRecoveryPassword = process.env.OWNER_PASSWORD || "";
    const ownerRecoveryMatches = Boolean(
      isOwnerLogin &&
        ownerRecoveryPassword &&
        secureTextEqual(password, ownerRecoveryPassword)
    );

    // Normal path: exact normalized email lookup.
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Recovery for legacy rows that may have been created with mixed-case email.
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });
    }

    // Owner recovery path. If an older deployment/database lost the owner row,
    // the private OWNER_PASSWORD in Vercel can safely recreate it.
    if (!user && ownerRecoveryMatches) {
      const hashedPassword = await hashPassword(password);
      const ownerName = (process.env.OWNER_NAME || "Car Dash Owner").trim();

      user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          password: hashedPassword,
          role: "owner",
          name: ownerName || "Car Dash Owner",
        },
        create: {
          email: normalizedEmail,
          password: hashedPassword,
          role: "owner",
          name: ownerName || "Car Dash Owner",
        },
      });

      console.warn("Owner login recovery recreated the owner account record.");
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let isValidPassword = false;
    try {
      isValidPassword = await verifyPassword(password, user.password);
    } catch (passwordError) {
      console.error("Stored password hash could not be verified:", passwordError);
    }

    // If the owner row survived but its password hash became stale/corrupt,
    // allow the private Vercel OWNER_PASSWORD to repair it on successful login.
    if (!isValidPassword && ownerRecoveryMatches) {
      const hashedPassword = await hashPassword(password);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          role: "owner",
        },
      });
      isValidPassword = true;
      console.warn("Owner login recovery refreshed the owner password hash.");
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const role = isOwnerLogin ? "owner" : user.role;

    if (isOwnerLogin && user.role !== "owner") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "owner" },
      });
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
