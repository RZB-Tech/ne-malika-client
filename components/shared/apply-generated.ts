import { MAX_PHOTOS, type UploadedPhoto } from "@/components/seller/photo-dropzone";

export interface ApplyResult {
  photos: UploadedPhoto[];
  /** Сколько вариантов не поместилось — о них нужно сказать вслух. */
  dropped: number;
}

/**
 * Ставит выбранные варианты на место исходного фото: первый заменяет его,
 * остальные уходят в конец галереи.
 *
 * Вынесено из форм товара, потому что тремя копиями этот код уже разошёлся бы:
 * одна и та же склейка лежала в админской форме и в обеих формах продавца.
 *
 * Лимит проверяется здесь же. Дропзона режет добавление по MAX_PHOTOS, но
 * генерация шла мимо неё, и одиннадцатое фото доезжало до бэкенда, где
 * валидация (photos maxItems: 10) отклоняла сохранение целиком — продавец
 * видел сырой текст ошибки вместо понятного отказа.
 */
export function applyGenerated(
  prev: UploadedPhoto[],
  sourceId: string | undefined,
  generated: UploadedPhoto[],
): ApplyResult {
  const at = sourceId ? prev.findIndex((p) => p.id === sourceId) : -1;

  const room = MAX_PHOTOS - prev.length + (at === -1 ? 0 : 1);
  const fitting = generated.slice(0, Math.max(0, room));
  const dropped = generated.length - fitting.length;

  if (fitting.length === 0) return { photos: prev, dropped };

  if (at === -1) return { photos: [...prev, ...fitting], dropped };

  const next = [...prev];
  next.splice(at, 1, fitting[0]);
  return { photos: [...next, ...fitting.slice(1)], dropped };
}
