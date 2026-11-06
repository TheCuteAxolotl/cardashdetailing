"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";

export default function Photo({ initial }: { initial: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-2">
      {url && (
        <img
          src={url}
          alt="Product photo preview"
          className="h-32 w-32 object-contain"
        />
      )}
      <label className="block">
        Product photo
        <input
          className="block"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            const extension = (
              {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
              } as Record<string, string>
            )[file.type];
            input.value = "";
            setBusy(true);
            setMessage("Uploading photo…");
            try {
              if (!extension || file.size > 20 * 1024 * 1024)
                throw Error("Choose a JPG, PNG or WebP under 20 MB.");
              const blob = await upload(
                "merch/" + crypto.randomUUID() + "." + extension,
                file,
                {
                  access: "public",
                  handleUploadUrl: "/api/shop-photo",
                  contentType: file.type,
                },
              );
              setUrl(blob.url);
              setMessage("Photo uploaded. Save the variant to apply it.");
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Upload failed. Try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <details>
        <summary>Use a photo URL</summary>
        <input
          type="url"
          aria-label="Product photo URL"
          value={url}
          disabled={busy}
          onChange={(e) => setUrl(e.target.value)}
        />
      </details>
      <input type="hidden" name="image" value={url} />
      <p role="status">{message}</p>
      <button disabled={busy} type="submit">
        Save variant
      </button>
    </div>
  );
}
