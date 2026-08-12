import type { Locale } from "./i18n/config";

const localeTag: Record<Locale, string> = {
  ru: "ru-RU",
  "uz-Latn": "uz-Latn",
  "uz-Cyrl": "uz-Cyrl",
};

export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Цена вместе с валютой, а для товара без цены — «Договорная».
 *
 * Пустая цена — не ошибка и не ноль: часть техники на рынке продают по
 * договорённости, и подставлять туда «0 сум» нельзя.
 */
export function priceText(
  value: string | number | null | undefined,
  locale: Locale,
  t: (key: string) => string,
): string {
  if (value === null || value === undefined || value === "") {
    return t("product.negotiable");
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return t("product.negotiable");
  return `${formatPrice(amount, locale)} ${t("common.currency")}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Время сообщения в переписке: сегодняшнее — одними часами, прежнее — с датой.
 * Год не показываем никогда: разговор, которому больше года, всё равно читают
 * не ради года.
 */
export function formatMessageTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(localeTag[locale], {
    hour: "2-digit",
    minute: "2-digit",
    ...(sameDay ? {} : { day: "numeric", month: "short" }),
  }).format(date);
}

/**
 * Цена в поле ввода: только целые сомы с разделителями разрядов.
 * Строку трактуем как пользовательский ввод (выкидываем всё нечисловое),
 * число — как значение с бэкенда (`price` приходит как "1500000.00",
 * дробную часть отбрасываем, иначе она попадает в инпут как ".00").
 */
export function formatPriceInput(raw: string | number): string {
  const digits =
    typeof raw === "number"
      ? Number.isFinite(raw)
        ? String(Math.trunc(raw))
        : ""
      : raw.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ru-RU") : "";
}

/** Обратно: "1 500 000" → 1500000. */
export function parsePriceInput(value: string): number {
  return Number(value.replace(/\D/g, "")) || 0;
}
