export function safeResourceUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

// Small pure helpers for turning share links into embeddable URLs / thumbnails.
export function toEmbedUrl(value = '') {
  const safe = safeResourceUrl(value);
  if (!safe) return '';
  const url = new URL(safe), host = url.hostname.replace(/^www\./, '');
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.split('/')[2];
    if (id && /^[a-zA-Z0-9_-]+$/.test(id)) return 'https://www.youtube.com/embed/' + id;
  }
  if (host === 'vimeo.com' && /^\/\d+$/.test(url.pathname)) return 'https://player.vimeo.com/video' + url.pathname;
  const drive = host === 'drive.google.com' && url.pathname.match(/^\/file\/d\/([^/]+)/);
  if (drive) return 'https://drive.google.com/file/d/' + drive[1] + '/preview';
  return safe;
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
