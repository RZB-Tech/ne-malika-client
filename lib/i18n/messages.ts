import type { Locale } from "./config";
import ru from "./locales/ru.json";

/**
 * Каталог сообщений. Сами тексты лежат по одному файлу на язык в `locales/`.
 *
 * `ru` задаёт форму: тип собран по нему, и пропущенный в переводе ключ — ошибка
 * сборки, а не путь вместо текста на экране у покупателя. Он же статический
 * фолбэк: пока узбекский словарь не догрузился, показывается русский.
 *
 * `uz-Latn` и `uz-Cyrl` — один и тот же узбекский в двух письменностях. Правя
 * один, правьте и второй: это транслитерации друг друга. Оба везутся отдельными
 * чанками и грузятся только когда выбраны: три словаря в основном бандле —
 * это ~176 КБ, из которых каждая сессия использует один.
 *
 * Доступ — через `t()` по пути с точками.
 */
export type Messages = typeof ru;

const loaded: Partial<Record<Locale, Messages>> = { ru };

const loaders: Partial<Record<Locale, () => Promise<{ default: Messages }>>> = {
  "uz-Latn": () => import("./locales/uz-latn.json"),
  "uz-Cyrl": () => import("./locales/uz-cyrl.json"),
};

/** Словарь, доступный синхронно: ru всегда, узбекский — после загрузки. */
export function getMessages(locale: Locale): Messages | undefined {
  return loaded[locale];
}

/** Догружает узбекский словарь (один раз, дальше из кэша модуля). */
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
