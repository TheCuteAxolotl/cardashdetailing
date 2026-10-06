import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "gallery")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();
        if (!/\.(mp4|webm|mov|m4v|ogv|ogg)$/.test(lower)) {
          throw new Error("Please upload a supported video file.");
        }
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-m4v",
            "video/ogg",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
