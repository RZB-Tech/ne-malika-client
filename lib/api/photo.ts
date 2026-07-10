// Product/shop photos are stored as bare S3 object keys (uuid v4). They are
// served through the backend proxy `GET /files/:key`, which streams the image
// from S3 with the right Content-Type and long-lived cache headers. The route
// is public, so an <img src> can point at it directly.
//
// In local dev the bucket may not have the object, so callers should fall back
// to the existing hue-gradient placeholder when a key is missing or the image
// fails to load.

import { API_BASE_URL } from "./mutator";

// `API_BASE_URL` is the origin (generated endpoint paths carry the `/api/v1`
// prefix themselves). `NEXT_PUBLIC_API_URL` may or may not already include the
// prefix, so normalise to a bare origin and append the versioned path.
const ORIGIN = API_BASE_URL.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
const FILES_BASE = `${ORIGIN}/api/v1/files`;

export function photoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  // Already a full URL (defensive).
  if (/^https?:\/\//.test(key)) return key;
  return `${FILES_BASE}/${encodeURIComponent(key)}`;
}

export function firstPhotoUrl(
  photos: string[] | null | undefined,
): string | null {
  return photoUrl(photos?.[0]);
}
