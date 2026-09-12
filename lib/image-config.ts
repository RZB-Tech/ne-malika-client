// Shared by the browser and Next's optimizer so their allowlists stay in sync.
const api = new URL(process.env.NEXT_PUBLIC_API_URL?.trim() || "https://api.nemalika.uz");
const storage = new URL(
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE?.trim() || "https://static.nemalika.uz",
);

export const imageRemotePatterns = [
  new URL("/api/v1/files/**", api),
  new URL(`${storage.pathname.replace(/\/$/, "")}/**`, storage),
];

export function canOptimizeImage(src: string): boolean {
  try {
    const url = new URL(src);
    return imageRemotePatterns.some(
      (pattern) =>
        url.origin === pattern.origin &&
        url.pathname.startsWith(pattern.pathname.slice(0, -2)) &&
        !url.search,
    );
  } catch {
    return false;
  }
}

export const PRODUCT_CARD_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 230px";
