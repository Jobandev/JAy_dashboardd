// Small pure helpers for turning share links into embeddable URLs / thumbnails.
export function toEmbedUrl(url = "") {
  if (url.includes("youtube.com/watch"))
    return `https://www.youtube.com/embed/${new URL(url).searchParams.get(
      "v"
    )}`;
  if (url.includes("youtu.be/"))
    return `https://www.youtube.com/embed/${url.split("/").pop()}`;
  if (url.includes("vimeo.com/"))
    return `https://player.vimeo.com/video/${url.split("/").pop()}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return url;
}
export function getContentThumbnail(asset = {}) {
  const explicit = asset.thumbnailUrl || asset.previewImage || asset.poster || asset.coverImage || asset.image;
  if (typeof explicit === "string" && explicit.trim()) return explicit;

  const url = asset.url || asset.externalUrl || "";
  if (!url) return null;

  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) return url;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const id = parsed.searchParams.get("v") || url.split("/").pop().split("?")[0];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (hostname.includes("vimeo.com")) {
      const id = url.split("/").filter(Boolean).pop();
      return id ? `https://vumbnail.com/${id}.jpg` : null;
    }
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1000`;
  } catch {
    return null;
  }

  return null;
}
