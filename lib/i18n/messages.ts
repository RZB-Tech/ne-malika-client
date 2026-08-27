import type { Locale } from "./config";
import ru from "./locales/ru.json";

export type Messages = typeof ru;

const loaded: Partial<Record<Locale, Messages>> = { ru };

const loaders: Partial<Record<Locale, () => Promise<{ default: Messages }>>> = {
  "uz-Latn": () => import("./locales/uz-latn.json"),
  "uz-Cyrl": () => import("./locales/uz-cyrl.json"),
};

export function getMessages(locale: Locale): Messages | undefined {
  return loaded[locale];
}

export function loadMessages(locale: Locale): Promise<Messages> {
  const ready = loaded[locale];
  if (ready) return Promise.resolve(ready);
  const load = loaders[locale];
  if (!load) return Promise.resolve(ru);
  return load().then((mod) => {
    const msgs = mod.default;
    loaded[locale] = msgs;
    return msgs;
  });
}
