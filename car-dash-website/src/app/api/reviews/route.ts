import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const approvedParam = request.nextUrl.searchParams.get("approved");

    if (auth?.role === "owner" && approvedParam === null) {
      const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(reviews, { status: 200 });
    }

    const approved = approvedParam === "false" ? false : true;
    const reviews = await prisma.review.findMany({
      where: { approved },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, rating, comment } = await request.json();

    const review = await prisma.review.create({
      data: { name, email, rating, comment, approved: false },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
