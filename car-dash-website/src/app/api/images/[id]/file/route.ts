import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves one gallery photo as a real image file so pages can use it in an
// <img> tag (lazy-loaded and cached) instead of downloading it inside JSON.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const image = await prisma.galleryImage.findUnique({ where: { id }, select: { url: true } });
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(image.url);
    if (!match) {
      if (/^https?:\/\//i.test(image.url)) return NextResponse.redirect(image.url, 302);
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }

    return new NextResponse(new Uint8Array(Buffer.from(match[2], "base64")), {
      status: 200,
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error serving gallery image:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
