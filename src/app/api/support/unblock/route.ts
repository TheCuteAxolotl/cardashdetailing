import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { createHash } from "crypto";

function isOwner(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) return false;

  return (
    auth.role === "owner" ||
    auth.email.toLowerCase() === OWNER_EMAIL.toLowerCase()
  );
}

function normalizeIdentifier(identifier: string) {
  const value = identifier.trim();

  // If it's already a 64-character SHA-256 hash, use it directly.
  if (/^[a-f0-9]{64}$/i.test(value)) {
    return value.toLowerCase();
  }

  // Otherwise assume an IP was pasted and hash it
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    if (!isOwner(request)) {
      return NextResponse.json(
        { error: "Owner login required" },
        { status: 403 }
      );
    }

    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "IP address or visitor hash is required" },
        { status: 400 }
      );
    }

    const hash = normalizeIdentifier(String(identifier));

    const blocked = await prisma.blockedVisitor.findUnique({
      where: { hash },
    });

    if (!blocked) {
      return NextResponse.json(
        { error: "That visitor is not currently blocked." },
        { status: 404 }
      );
    }

    await prisma.blockedVisitor.delete({
      where: { hash },
    });

    return NextResponse.json({
      success: true,
      message: "Visitor unblocked successfully.",
    });
  } catch (error) {
    console.error("Error unblocking visitor:", error);

    return NextResponse.json(
      { error: "Failed to unblock visitor." },
      { status: 500 }
    );
  }
}
