/**
 * Безопасная сериализация JSON-LD для вставки в <script type="application/ld+json">.
 *
 * JSON.stringify не экранирует «<», поэтому строка из карточки товара вида
 * `</script><img src=x onerror=...>` закрывает тег скрипта: HTML-парсер ищет
 * последовательность «</script» без оглядки на то, что она внутри строки JSON.
 * Это давало хранимый XSS на публичной странице товара — имя, описание и
 * характеристики пишет продавец.
 *
 * Экранируем «<», «>» и «&» как \uXXXX: внутри строки JSON это тот же символ,
 * но парсер HTML его уже не видит. Заодно U+2028/U+2029 — они валидны в JSON,
 * но обрывают строку при разборе как JavaScript.
 */
const UNSAFE = /[<>&\u2028\u2029]/g;

function escapeChar(ch: string): string {
  return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, escapeChar);
}
