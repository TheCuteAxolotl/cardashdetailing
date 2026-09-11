import { NextResponse } from "next/server";
import { getAuthToken, verifyToken, getRoleForEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLikelyDatabaseError, databaseUnavailableResponseMessage } from "@/lib/database-errors";

export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const role = getRoleForEmail(user.email, user.role);

    if (role !== user.role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });
    }

    return NextResponse.json(
      {
        user: {
          ...user,
          role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth error:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
