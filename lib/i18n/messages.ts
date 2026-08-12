import type { Locale } from "./config";
import ru from "./locales/ru.json";
import uzLatn from "./locales/uz-latn.json";
import uzCyrl from "./locales/uz-cyrl.json";

/**
 * Каталог сообщений. Сами тексты лежат по одному файлу на язык в `locales/`:
 * три словаря в одном модуле разрослись до трёх тысяч строк, и правка русской
 * строки заставляла листать мимо двух узбекских.
 *
 * `ru` задаёт форму: тип собран по нему, и пропущенный в переводе ключ — ошибка
 * сборки, а не путь вместо текста на экране у покупателя.
 *
 * `uz-Latn` и `uz-Cyrl` — один и тот же узбекский в двух письменностях. Правя
 * один, правьте и второй: это транслитерации друг друга.
 *
 * Доступ — через `t()` по пути с точками.
 */
export type Messages = typeof ru;

export const messages: Record<Locale, Messages> = {
  ru,
  "uz-Latn": uzLatn,
  "uz-Cyrl": uzCyrl,
};
