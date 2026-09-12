import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthFromRequest,
  getRoleForEmail,
  isStaffRole,
  verifyPassword,
} from "@/lib/auth";
import {
  databaseUnavailableResponseMessage,
  isLikelyDatabaseError,
} from "@/lib/database-errors";

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { currentPassword, confirmation } = await request.json();

    if (!currentPassword || confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Enter your current password and type DELETE to confirm." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
      response.cookies.set("auth-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    const effectiveRole = getRoleForEmail(user.email, user.role);
    if (isStaffRole(effectiveRole)) {
      return NextResponse.json(
        { error: "Staff accounts cannot be deleted from the customer account page." },
        { status: 403 }
      );
    }

    const validPassword = await verifyPassword(currentPassword, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Relations in the Prisma schema use cascading deletes for customer-owned
    // data such as vehicles, quote threads, warranties, and account bookings.
    await prisma.user.delete({
      where: { id: user.id },
    });

    const response = NextResponse.json(
      { message: "Your account has been permanently deleted." },
      { status: 200 }
    );

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Unable to delete your account right now." },
      { status: 500 }
    );
  }
}
