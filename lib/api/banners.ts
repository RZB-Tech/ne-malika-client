import type { Locale } from "@/lib/i18n/config";
import type { BannerDto } from "./generated/schemas";
import { photoUrl } from "./photo";

export type Banner = BannerDto;

/**
 * Допустимые размеры картинки баннера. Те же числа продублированы в
 * `src/modules/banners/banners.constants.ts` на бэкенде — там они попадают в
 * описание Swagger. Меняя здесь, поменяйте и там.
 *
 * Первый в списке — основной: по нему карусель считает высоту слота. Остальные
 * тоже принимаются, но встают в тот же слот с полями по краям.
 */
export const BANNER_FORMATS = [
  { width: 1942, height: 809 },
  { width: 1240, height: 400 },
] as const;

export const BANNER_PRIMARY_FORMAT = BANNER_FORMATS[0];

/** Строка для подсказок и ошибок: «1942×809 / 1240×400». */
export const BANNER_FORMATS_LABEL = BANNER_FORMATS.map(
  (f) => `${f.width}×${f.height}`,
).join(" / ");

/**
 * Пропорция слота карусели — ширина, делённая на высоту.
 *
 * Карусель всегда во всю ширину витрины, поэтому это единственная ручка высоты.
 * По умолчанию равна пропорции основного формата: баннер виден целиком, полей по
 * краям нет. Раньше высота ограничивалась потолком в пикселях, но при этом
 * карусель становилась уже витрины и слева и справа оставалось пусто.
 *
 * Чтобы сделать баннер ниже, увеличьте число — слот станет шире своей картинки,
 * и она кадрируется по центру, теряя верх и низ. Для баннера с текстом у краёв
 * это заметно, поэтому по умолчанию кадрирования нет. Ориентир: 2.9 срезает
 * около 17% высоты, 3.1 — около 23%.
 */
export const BANNER_SLOT_RATIO =
  BANNER_PRIMARY_FORMAT.width / BANNER_PRIMARY_FORMAT.height;

/** То же значение для CSS `aspect-ratio` — витрина и превью в админке едины. */
export const BANNER_ASPECT_CSS = String(BANNER_SLOT_RATIO);

/** Допуск по соотношению сторон: 1241×400 — это опечатка, а не другой формат. */
const ASPECT_TOLERANCE = 0.02;

/**
 * Насколько картинка может быть уже эталона. Порог по ширине нужен, чтобы
 * баннер не растягивали из мелкого файла, но отклонять 1920×800 из-за
 * недостающих 22 пикселей — придирка: на экране такой разницы не видно.
 */
const MIN_WIDTH_RATIO = 0.95;

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
 * картинки, а баннер произвольной пропорции встал бы в карусель с полями —
 * админ узнал бы об этом уже с главной страницы.
 *
 * Подходит любой формат из списка, в том числе кратно больший под ретину
 * (3884×1618): важна пропорция и то, что картинку не придётся растягивать.
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

  const aspect = size.width / size.height;
  const fits = BANNER_FORMATS.some(
    (f) =>
      size.width >= f.width * MIN_WIDTH_RATIO &&
      Math.abs(aspect - f.width / f.height) <= ASPECT_TOLERANCE,
  );
  return fits ? null : "resolution";
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
