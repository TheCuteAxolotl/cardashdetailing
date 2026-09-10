import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const approvedParam = request.nextUrl.searchParams.get("approved");

    if (auth?.role === "owner" && approvedParam === null) {
      const reviews = await prisma.review.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(reviews, { status: 200 });
    }

    const approved = approvedParam === "false" ? false : true;

    const reviews = await prisma.review.findMany({
      where: {
        approved,
      },
      orderBy: {
        createdAt: "desc",
      },
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

    if (!name || !rating || !comment) {
      return NextResponse.json(
        { error: "Name, rating, and comment are required" },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : "",
        rating: numericRating,
        comment: String(comment).trim(),
        approved: false,
      },
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
