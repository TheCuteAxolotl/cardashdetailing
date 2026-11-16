import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isImageMedia } from "@/lib/media";

// Serves the current photo for a placement (for example "hero") as a real
// image file. Pages can point an <img> straight at this URL, so the browser
// starts loading the photo immediately and Vercel's network caches it,
// instead of waiting for JavaScript to download the photo inside JSON.
const CACHE = "public, max-age=60, s-maxage=120, stale-while-revalidate=86400";

async function newestPhoto(category: string) {
  const rows = await prisma.galleryImage.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { url: true },
  });
  return rows.find((row) => isImageMedia(row.url)) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const category = (params.get("category") || "").trim().slice(0, 120);
    const fallback = (params.get("fallback") || "").trim().slice(0, 120);
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const photo = (await newestPhoto(category)) ?? (fallback && fallback !== category ? await newestPhoto(fallback) : null);
    if (!photo) {
      return NextResponse.json({ error: "No photo for this placement" }, { status: 404, headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
    }

    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(photo.url);
    if (!match) {
      if (/^https?:\/\//i.test(photo.url)) {
        const redirect = NextResponse.redirect(photo.url, 302);
        redirect.headers.set("Cache-Control", CACHE);
        return redirect;
      }
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }

    return new NextResponse(new Uint8Array(Buffer.from(match[2], "base64")), {
      status: 200,
      headers: { "Content-Type": match[1], "Cache-Control": CACHE },
    });
  } catch (error) {
    console.error("Error serving site photo:", error);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 500 });
  }
}
