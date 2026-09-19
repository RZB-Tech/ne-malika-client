import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Shared by the browser and Next's optimizer so their allowlists stay in sync.
const api = new URL(process.env.NEXT_PUBLIC_API_URL?.trim() || "https://api.nemalika.uz");
const storage = new URL(
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE?.trim() || "https://static.nemalika.uz",
);

export const imageRemotePatterns: RemotePattern[] = [
  {
    protocol: (api.protocol.replace(":", "") || "https") as "http" | "https",
    hostname: api.hostname,
    port: api.port || undefined,
    pathname: "/api/v1/files/**",
  },
  {
    protocol: (storage.protocol.replace(":", "") || "https") as "http" | "https",
    hostname: storage.hostname,
    port: storage.port || undefined,
    pathname: `${storage.pathname.replace(/\/$/, "")}/**`,
  },
];

export function canOptimizeImage(src: string): boolean {
  try {
    const url = new URL(src);
    return imageRemotePatterns.some((pattern) => {
      const prefix = (pattern.pathname ?? "").replace(/\*\*$/, "");
      return (
        url.hostname === pattern.hostname &&
        url.pathname.startsWith(prefix) &&
        !url.search
      );
    });
  } catch {
    return false;
  }
}

export const PRODUCT_CARD_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 230px";
