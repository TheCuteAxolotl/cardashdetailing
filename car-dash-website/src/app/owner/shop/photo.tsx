"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";

export default function Photo({
  initial,
  saveLabel,
}: {
  initial: string[];
  saveLabel: string;
}) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  async function uploadFiles(files: File[]) {
    if (busy || !files.length) return;
    if (files.length + photos.length > 12) {
      setMessage(
        "This color holds 12 photos total. Remove a photo or choose a smaller batch.",
      );
      return;
    }
    setBusy(true);
    try {
      const failed: string[] = [];
      let completed = 0;
      setMessage(`Uploading 0 of ${files.length}…`);
      for (let start = 0; start < files.length; start += 4) {
        const group = files.slice(start, start + 4);
        const results = await Promise.allSettled(
          group.map(async (file) => {
            const ext = (
              {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
              } as Record<string, string>
            )[file.type];
            try {
              if (!ext || file.size > 20 * 1024 * 1024)
                throw Error("Use JPG, PNG or WebP under 20 MB.");
              const blob = await upload(
                "merch/" + crypto.randomUUID() + "." + ext,
                file,
                {
                  access: "public",
                  handleUploadUrl: "/api/shop-photo",
                  contentType: file.type,
                },
              );
              return blob.url;
            } finally {
              setMessage(`Processed ${++completed} of ${files.length} photos…`);
            }
          }),
        );
        const urls: string[] = [];
        results.forEach((result, i) => {
          if (result.status === "fulfilled") urls.push(result.value);
          else failed.push(group[i].name);
        });
        setPhotos((current) => [...current, ...urls]);
      }
      const count = files.length - failed.length;
      setMessage(
        failed.length
          ? `${count} uploaded. Retry: ${failed.join(", ")}. Use JPG, PNG or WebP up to 20 MB each.`
          : `${count} photos uploaded. Save to apply them.`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <p>
        Photos for this color · first photo is the cover · {photos.length}/12
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, index) => (
          <div key={url}>
            <img
              src={url}
              alt={"Product view " + (index + 1)}
              className="h-24 w-24 object-contain"
            />
            <input type="hidden" name="image" value={url} />
            <label>
              Position
              <select
                aria-label={"Position of photo " + (index + 1)}
                value={index}
                disabled={busy}
                onChange={(event) => {
                  const position = Number(event.target.value);
                  setPhotos((current) => {
                    const ordered = current.filter((photo) => photo !== url);
                    ordered.splice(position, 0, url);
                    return ordered;
                  });
                  setMessage(
                    "Photo order updated. Save the variant to apply it.",
                  );
                }}
              >
                {photos.map((photo, position) => (
                  <option key={photo} value={position}>
                    {position === 0 ? "1 · Cover" : position + 1}
                  </option>
                ))}
              </select>
            </label>
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
      <label
        className={
          "block cursor-pointer rounded-xl border-2 border-dashed p-5 " +
          (dragging ? "border-amber-400 bg-amber-400/10" : "border-neutral-500")
        }
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = busy ? "none" : "copy";
          setDragging(!busy);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
      >
        {dragging
          ? "Drop photos here"
          : "Drop multiple photos here or choose files"}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void uploadFiles(files);
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
        {saveLabel}
      </button>
    </div>
  );
}
