import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { isLikelyDatabaseError, databaseUnavailableResponseMessage } from "@/lib/database-errors";

const MAX_DATA_URL_CHARS = 1_600_000;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const categories = params
      .getAll("category")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    const requestedLimit = Number(params.get("limit") || "0");
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 50)
      : undefined;

    const images = await prisma.galleryImage.findMany({
      where: categories.length
        ? {
            category: {
              in: categories,
            },
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    const response = NextResponse.json(images, { status: 200 });

    // Public image data can be cached briefly. This reduces repeated database
    // connections while still allowing dashboard changes to appear quickly.
    if (categories.length || limit) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=10, s-maxage=30, stale-while-revalidate=120"
      );
    } else {
      response.headers.set("Cache-Control", "no-store");
    }

    return response;
  } catch (error) {
    console.error("Error fetching images:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth || auth.role !== "owner") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { url, title, category } = await request.json();

    if (!url || !title || !category) {
      return NextResponse.json(
        { error: "Image, title, and category are required" },
        { status: 400 }
      );
    }

    if (!String(url).startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Please upload an image file from the dashboard" },
        { status: 400 }
      );
    }

    if (String(url).length > MAX_DATA_URL_CHARS) {
      return NextResponse.json(
        { error: "Image is too large after compression" },
        { status: 413 }
      );
    }

    const image = await prisma.galleryImage.create({
      data: {
        url: String(url),
        title: String(title).trim().slice(0, 120),
        category: String(category).trim().slice(0, 120),
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error creating image:", error);

    if (isLikelyDatabaseError(error)) {
      return NextResponse.json(
        { error: databaseUnavailableResponseMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}
