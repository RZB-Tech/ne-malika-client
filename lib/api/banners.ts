import type { Locale } from "@/lib/i18n/config";
import type { AdminBannerDto, BannerDto, PublicBannerDto } from "./generated/schemas";
import { photoUrl } from "./photo";

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

export type BannerPhotos = Pick<PublicBannerDto, "photoRu" | "photoUzLatn">;

/**
 * Языки, на которых баннер рисуют. Их два, тогда как языков интерфейса три:
 * узбекская кириллица отдельной плашки не получает и показывается латиницей.
 * Формы загрузки ходят по этому списку, а не по `locales`, — иначе продавец
 * искал бы третий слот, которого на сервере уже нет.
 */
export const BANNER_LOCALES = ["ru", "uz-Latn"] as const satisfies readonly Locale[];

export type BannerLocale = (typeof BANNER_LOCALES)[number];

/**
 * Картинок у баннера две, а языков интерфейса три.
 *
 * Отдельной плашки на узбекской кириллице не рисуют: текст акции нарисован
 * прямо на картинке, и третий её вариант приходилось бы заказывать дизайнеру
 * ради письменности, а не ради языка. Читателю кириллицы показываем узбекскую
 * латиницу, а не русскую версию: язык для него важнее начертания.
 */
const PHOTO_FIELD: Record<Locale, keyof BannerPhotos> = {
  ru: "photoRu",
  "uz-Latn": "photoUzLatn",
  "uz-Cyrl": "photoUzLatn",
};

export function bannerPhotoKey(banner: BannerPhotos, locale: Locale): string {
  return banner[PHOTO_FIELD[locale]] ?? banner.photoRu;
}

export function bannerImageUrl(banner: BannerPhotos, locale: Locale): string | null {
  return photoUrl(bannerPhotoKey(banner, locale));
}

/**
 * Срок показа хранится точкой во времени, а в админке выбирается днём:
 * выбранный день баннер ещё отрабатывает целиком и гаснет в его конце.
 */
export function expiryToInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function expiryFromInput(value: string): string | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export function bannerExpired(banner: { expiresAt?: string | null }): boolean {
  return Boolean(banner.expiresAt) && new Date(banner.expiresAt!).getTime() <= Date.now();
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
