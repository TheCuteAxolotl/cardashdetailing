import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { getMediaKind } from "@/lib/media";
import { isPhotoOnlyMediaCategory } from "@/lib/media-placements";

async function canManageGallery(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  return hasStaffPermission(auth, "gallery");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await canManageGallery(request))) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { title, category } = await request.json();
    const params = await context.params;
    const nextCategory = String(category || "gallery").trim().slice(0, 120);

    if (isPhotoOnlyMediaCategory(nextCategory)) {
      const existing = await prisma.galleryImage.findUnique({ where: { id: params.id }, select: { url: true } });
      if (!existing) return NextResponse.json({ error: "Media not found" }, { status: 404 });
      if (getMediaKind(existing.url) !== "image") {
        return NextResponse.json({ error: "Hero placements only accept photos." }, { status: 400 });
      }
    }

    const image = await prisma.galleryImage.update({
      where: {
        id: params.id,
      },
      data: {
        title: String(title || "Untitled")
          .trim()
          .slice(0, 120),
        category: nextCategory,
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
    if (!(await canManageGallery(request))) {
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
