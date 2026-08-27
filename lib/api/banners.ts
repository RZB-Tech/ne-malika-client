import type { Locale } from "@/lib/i18n/config";
import type { AdminBannerDto, BannerDto, PublicBannerDto } from "./generated/schemas";
import { photoUrl } from "./photo";

export type { BannerModerationStatus } from "./types";

export type Banner = BannerDto;

export type AdminBanner = AdminBannerDto;

export type PublicBanner = PublicBannerDto;

export const BANNER_FORMATS = [
  { width: 1942, height: 809 },
  { width: 1240, height: 400 },
] as const;

export const BANNER_PRIMARY_FORMAT = BANNER_FORMATS[0];

export const BANNER_FORMATS_LABEL = BANNER_FORMATS.map((f) => `${f.width}×${f.height}`).join(" / ");

export const BANNER_SLOT_RATIO = BANNER_PRIMARY_FORMAT.width / BANNER_PRIMARY_FORMAT.height;

export const BANNER_ASPECT_CSS = String(BANNER_SLOT_RATIO);

const ASPECT_TOLERANCE = 0.02;

const MIN_WIDTH_RATIO = 0.95;

export const BANNER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const BANNER_MAX_BYTES = 10 * 1024 * 1024;

export type BannerPhotos = Pick<PublicBannerDto, "photoRu" | "photoUzLatn" | "photoUzCyrl">;

const PHOTO_FIELD: Record<Locale, keyof BannerPhotos> = {
  ru: "photoRu",
  "uz-Latn": "photoUzLatn",
  "uz-Cyrl": "photoUzCyrl",
};

export function bannerPhotoKey(banner: BannerPhotos, locale: Locale): string {
  return banner[PHOTO_FIELD[locale]] ?? banner.photoRu;
}

export function bannerImageUrl(banner: BannerPhotos, locale: Locale): string | null {
  return photoUrl(bannerPhotoKey(banner, locale));
}

export type BannerImageProblem = "type" | "size" | "resolution";

export async function checkBannerImage(file: File): Promise<BannerImageProblem | null> {
  if (!(BANNER_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "type";
  }
  if (file.size > BANNER_MAX_BYTES) return "size";

  const size = await readImageSize(file);
  if (!size) return "type";

  const aspect = size.width / size.height;
  const fits = BANNER_FORMATS.some(
    (f) =>
      size.width >= f.width * MIN_WIDTH_RATIO &&
      Math.abs(aspect - f.width / f.height) <= ASPECT_TOLERANCE,
  );
  return fits ? null : "resolution";
}

function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
