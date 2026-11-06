import { handleUpload } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const response = await handleUpload({
      request,
      body: await request.json(),
      onBeforeGenerateToken: async (path) => {
        if ((await getCurrentUser())?.role !== "owner")
          throw Error("Owner sign-in required.");
        if (!/^merch\/[a-f0-9-]+\.(jpg|png|webp)$/.test(path))
          throw Error("Unsupported product photo.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
