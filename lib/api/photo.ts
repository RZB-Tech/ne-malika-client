
const ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");
const FILES_BASE = `${ORIGIN}/api/v1/files`;

export function photoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  return `${FILES_BASE}/${encodeURIComponent(key)}`;
}
