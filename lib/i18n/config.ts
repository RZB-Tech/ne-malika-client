export const locales = ["ru", "uz-Latn", "uz-Cyrl"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  "uz-Latn": "O‘zbekcha",
  "uz-Cyrl": "Ўзбекча",
};

export const localeShort: Record<Locale, string> = {
  ru: "RU",
  "uz-Latn": "UZ",
  "uz-Cyrl": "ЎЗ",
};

export const STORAGE_KEY = "nemalika.locale";
