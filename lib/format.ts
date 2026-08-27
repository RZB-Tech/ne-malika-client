import type { Locale } from "./i18n/config";

const localeTag: Record<Locale, string> = {
  ru: "ru-RU",
  "uz-Latn": "uz-Latn",
  "uz-Cyrl": "uz-Cyrl",
};

const numberFormatCache = new Map<string, Intl.NumberFormat>();
function numberFormatter(locale: Locale, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const tag = localeTag[locale];
  const key = `${tag}:${JSON.stringify(opts)}`;
  let f = numberFormatCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, opts);
    numberFormatCache.set(key, f);
  }
  return f;
}

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(locale: Locale, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = localeTag[locale];
  const key = `${tag}:${JSON.stringify(opts)}`;
  let f = dateTimeFormatCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, opts);
    dateTimeFormatCache.set(key, f);
  }
  return f;
}

export function formatPrice(value: number, locale: Locale): string {
  return numberFormatter(locale, { maximumFractionDigits: 0 }).format(value);
}

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
  return numberFormatter(locale, {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(iso: string, locale: Locale): string {
  return dateFormatter(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return dateFormatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatMessageTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return dateFormatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(sameDay ? {} : { day: "numeric", month: "short" }),
  }).format(date);
}

export function formatPriceInput(raw: string | number): string {
  const digits =
    typeof raw === "number"
      ? Number.isFinite(raw)
        ? String(Math.trunc(raw))
        : ""
      : raw.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ru-RU") : "";
}

export function parsePriceInput(value: string): number {
  return Number(value.replace(/\D/g, "")) || 0;
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
