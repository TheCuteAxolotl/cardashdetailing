export type MediaItem = {
  id: string;
  url: string;
  title: string;
  category: string;
};

export type MediaKind = "image" | "video" | "youtube" | "vimeo";

export function getYouTubeId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0] || "")) return parts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getVimeoId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const candidate = parts.find((part) => /^\d+$/.test(part));
    return candidate || null;
  } catch {
    return null;
  }
}

export function getMediaKind(raw: string): MediaKind {
  const value = String(raw || "").trim();
  if (value.startsWith("data:image/")) return "image";
  if (value.startsWith("data:video/")) return "video";
  if (getYouTubeId(value)) return "youtube";
  if (getVimeoId(value)) return "vimeo";

  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase();
    if (/\.(mp4|webm|mov|m4v|ogv|ogg)$/.test(path)) return "video";
  } catch {
    // Fall through to image. Existing gallery records are image data URLs.
  }

  return "image";
}

export function isImageMedia(raw: string) {
  return getMediaKind(raw) === "image";
}

export function getMediaEmbedUrl(raw: string): string | null {
  const youtubeId = getYouTubeId(raw);
  if (youtubeId) return `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?rel=0`;
  const vimeoId = getVimeoId(raw);
  if (vimeoId) return `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`;
  return null;
}

export function getMediaThumbnailUrl(raw: string): string | null {
  const youtubeId = getYouTubeId(raw);
  if (youtubeId) return `https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`;
  return null;
}

export function isSupportedExternalVideoUrl(raw: string) {
  const value = String(raw || "").trim();
  if (!/^https?:\/\//i.test(value)) return false;
  if (getYouTubeId(value) || getVimeoId(value)) return true;
  try {
    const url = new URL(value);
    return /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(url.pathname);
  } catch {
    return false;
  }
}
