"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";

export default function Photo({ initial }: { initial: string[] }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  return (
    <div className="space-y-3">
      <p>Product photos · first photo is the cover</p>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, index) => (
          <div key={url}>
            <img
              src={url}
              alt={"Product view " + (index + 1)}
              className="h-24 w-24 object-contain"
            />
            <input type="hidden" name="image" value={url} />
            {index > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setPhotos([url, ...photos.filter((p) => p !== url)])
                }
              >
                Make cover
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setPhotos(photos.filter((p) => p !== url))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <label>
        Add photos (up to 12)
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length + photos.length > 12) {
              setMessage("Choose up to 12 photos per variant.");
              return;
            }
            setBusy(true);
            try {
              for (const [i, file] of files.entries()) {
                const ext = (
                  {
                    "image/jpeg": "jpg",
                    "image/png": "png",
                    "image/webp": "webp",
                  } as Record<string, string>
                )[file.type];
                if (!ext || file.size > 20 * 1024 * 1024)
                  throw Error(
                    "Choose JPG, PNG or WebP photos up to 20 MB each.",
                  );
                setMessage(
                  "Uploading " + (i + 1) + " of " + files.length + "…",
                );
                const blob = await upload(
                  "merch/" + crypto.randomUUID() + "." + ext,
                  file,
                  {
                    access: "public",
                    handleUploadUrl: "/api/shop-photo",
                    contentType: file.type,
                  },
                );
                setPhotos((current) => [...current, blob.url]);
              }
              setMessage(
                "Photos uploaded. Save the variant to publish your changes.",
              );
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <details>
        <summary>Add a photo URL</summary>
        <input
          aria-label="Photo URL"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!/^https:\/\//i.test(link.trim()) || photos.length >= 12) {
              setMessage("Enter an HTTPS URL. Limit 12 photos.");
              return;
            }
            setPhotos([...new Set([...photos, link.trim()])]);
            setLink("");
          }}
        >
          Add photo
        </button>
      </details>
      <p role="status">{message}</p>
      <button disabled={busy} type="submit">
        Save variant
      </button>
    </div>
  );
}
