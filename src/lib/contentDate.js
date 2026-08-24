export function contentPostedAt(asset) {
  const timestamp = asset?.createdAt;
  if (typeof timestamp?.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp?.seconds === "number") return timestamp.seconds * 1000;
  if (typeof asset?.postedAt === "number") return asset.postedAt;
  const parsed = Date.parse(asset?.date || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatContentPostedAt(asset) {
  const timestamp = contentPostedAt(asset);
  if (!timestamp) return asset?.date || "Date unavailable";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
