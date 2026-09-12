import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { cleanText, normalizeBlockIdentifier } from "@/lib/support-security";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!isOwnerAccount(auth)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const identifier = cleanText(body.identifier, 200);

    if (!identifier) {
      return NextResponse.json(
        { error: "Paste the IP or visitor hash from Discord." },
        { status: 400 }
      );
    }

    const hash = normalizeBlockIdentifier(identifier);

    const blockedVisitor = await prisma.blockedVisitor.findUnique({
      where: { hash },
    });

    if (!blockedVisitor) {
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
