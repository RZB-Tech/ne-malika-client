import type { Locale } from "./i18n/config";

const localeTag: Record<Locale, string> = { ru: "ru-RU", en: "en-US" };

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

export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}
