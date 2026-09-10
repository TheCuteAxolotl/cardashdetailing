import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

function ownerOnly(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  return Boolean(auth && auth.role === "owner");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!ownerOnly(request)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { title, category } = await request.json();
    const params = await context.params;

    const image = await prisma.galleryImage.update({
      where: {
        id: params.id,
      },
      data: {
        title: String(title || "Untitled")
          .trim()
          .slice(0, 120),
        category: String(category || "gallery")
          .trim()
          .slice(0, 40),
      },
    });

    return NextResponse.json(image, { status: 200 });
  } catch (error) {
    console.error("Error updating image:", error);

    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!ownerOnly(request)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const params = await context.params;

    await prisma.galleryImage.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image:", error);

    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
