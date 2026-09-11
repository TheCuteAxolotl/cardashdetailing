import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, getRoleForEmail } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { isLikelyDatabaseError, databaseUnavailableResponseMessage } from "@/lib/database-errors";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent registering as owner
    if (normalizedEmail === OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Cannot register with this email" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const role = getRoleForEmail(normalizedEmail);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        role,
      },
    });

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
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
    console.error("Registration error:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
