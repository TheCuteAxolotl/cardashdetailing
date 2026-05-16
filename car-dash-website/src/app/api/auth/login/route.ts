import { PrismaClient } from "@prisma/client";
import { verifyPassword, createToken } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const role = user.email === OWNER_EMAIL ? "owner" : user.role;
    if (user.email === OWNER_EMAIL && user.role !== "owner") {
      await prisma.user.update({
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
        user: { id: user.id, email: user.email, name: user.name, role },
      },
      { status: 200 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
