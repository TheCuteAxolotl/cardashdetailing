import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error fetching images:", error);
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

    const image = await prisma.galleryImage.create({
      data: { url, title, category },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}
