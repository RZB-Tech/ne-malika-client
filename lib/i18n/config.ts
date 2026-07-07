export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
};

export const localeShort: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
};

export const STORAGE_KEY = "yadro.locale";
