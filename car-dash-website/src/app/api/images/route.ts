import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();
const MAX_DATA_URL_CHARS = 1_600_000;

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || auth.role !== "owner") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { url, title, category } = await request.json();
    if (!url || !title || !category) {
      return NextResponse.json({ error: "Image, title, and category are required" }, { status: 400 });
    }
    if (!String(url).startsWith("data:image/")) {
      return NextResponse.json({ error: "Please upload an image file from the dashboard" }, { status: 400 });
    }
    if (String(url).length > MAX_DATA_URL_CHARS) {
      return NextResponse.json({ error: "Image is too large after compression" }, { status: 413 });
    }

    const image = await prisma.galleryImage.create({
      data: {
        url: String(url),
        title: String(title).trim().slice(0, 120),
        category: String(category).trim().slice(0, 40),
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}
