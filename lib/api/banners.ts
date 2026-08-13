import type { Locale } from "@/lib/i18n/config";
import type { BannerDto } from "./generated/schemas";
import { photoUrl } from "./photo";

export type Banner = BannerDto;

/**
 * Требуемое разрешение картинки баннера. Те же числа продублированы в
 * `src/modules/banners/banners.constants.ts` на бэкенде — там они попадают в
 * описание Swagger. Меняя здесь, поменяйте и там.
 */
export const BANNER_IMAGE = { width: 1240, height: 400 } as const;

const BANNER_ASPECT = BANNER_IMAGE.width / BANNER_IMAGE.height;

/** Допуск по соотношению сторон: 1241×400 — это опечатка, а не другой формат. */
const ASPECT_TOLERANCE = 0.02;

export const BANNER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Тот же потолок, что у бэкенда (MAX_FILE_SIZE_BYTES). */
export const BANNER_MAX_BYTES = 10 * 1024 * 1024;

/** Поле с ключом фото под каждый язык интерфейса. */
const PHOTO_FIELD: Record<Locale, keyof Pick<
  BannerDto,
  "photoRu" | "photoUzLatn" | "photoUzCyrl"
>> = {
  ru: "photoRu",
  "uz-Latn": "photoUzLatn",
  "uz-Cyrl": "photoUzCyrl",
};

export function bannerPhotoKey(banner: BannerDto, locale: Locale): string {
  return banner[PHOTO_FIELD[locale]] ?? banner.photoRu;
}

export function bannerImageUrl(
  banner: BannerDto,
  locale: Locale,
): string | null {
  return photoUrl(bannerPhotoKey(banner, locale));
}

export type BannerImageProblem = "type" | "size" | "resolution";

/**
 * Проверка выбранного файла до загрузки в S3.
 *
 * Разрешение сверяем на клиенте: сервер видит только байты и не разбирает
 * картинки, а баннер не той пропорции обрезался бы в карусели — админ узнал бы
 * об этом уже с главной страницы.
 *
 * Кратно больший файл (2480×800 под ретину) проходит: важна пропорция и то,
 * что картинку не придётся растягивать.
 */
export async function checkBannerImage(
  file: File,
): Promise<BannerImageProblem | null> {
  if (!(BANNER_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "type";
  }
  if (file.size > BANNER_MAX_BYTES) return "size";

  const size = await readImageSize(file);
  if (!size) return "type";

  if (size.width < BANNER_IMAGE.width) return "resolution";
  if (Math.abs(size.width / size.height - BANNER_ASPECT) > ASPECT_TOLERANCE) {
    return "resolution";
  }
  return null;
}

function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
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
