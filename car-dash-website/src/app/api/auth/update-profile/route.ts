import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
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

    const { name } = await request.json();
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { name: trimmedName },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
