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
