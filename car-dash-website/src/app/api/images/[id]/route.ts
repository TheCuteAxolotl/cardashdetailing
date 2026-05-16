import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || auth.role !== "owner") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const params = await context.params;
    await prisma.galleryImage.delete({
      where: { id: params.id },
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
