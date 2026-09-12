import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthFromRequest,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Please complete all password fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error:
            "Choose a new password that is different from your current password.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: auth.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const validCurrentPassword = await verifyPassword(
      currentPassword,
      user.password
    );

    if (!validCurrentPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: auth.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "Password updated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { error: "Unable to update password right now." },
      { status: 500 }
    );
  }
}
