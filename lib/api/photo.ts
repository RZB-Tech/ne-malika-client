// Product/shop photos are stored as bare S3 object keys (uuid v4). They are
// served through the backend proxy `GET /files/:key`, which streams the image
// from S3 with the right Content-Type and long-lived cache headers. The route
// is public, so an <img src> can point at it directly.
//
// In local dev the bucket may not have the object, so callers should fall back
// to the existing hue-gradient placeholder when a key is missing or the image
// fails to load.

// Читаем NEXT_PUBLIC_API_URL напрямую, а не через ./mutator: там axios и
// браузерный token-store, из-за которых этот модуль (и mappers, что его
// импортируют) нельзя было звать в серверных компонентах / generateMetadata.
// `NEXT_PUBLIC_API_URL` может уже содержать /api/v1 — нормализуем к origin и
// добавляем версионированный путь сами.
const ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");
const FILES_BASE = `${ORIGIN}/api/v1/files`;

export function photoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  // Already a full URL (defensive).
  if (/^https?:\/\//.test(key)) return key;
  return `${FILES_BASE}/${encodeURIComponent(key)}`;
}
