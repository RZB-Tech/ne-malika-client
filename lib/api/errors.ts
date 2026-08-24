/**
 * Сообщение об ошибке API для тоста: текст сервера, если он есть, иначе
 * переводной фолбэк. Единая точка вместо двух десятков копий
 * `err instanceof Error ? err.message : t(...)` — и единая политика:
 * серверный текст показываем, потому что он конкретнее нашего перевода.
 */
export function apiErrorMessage(
  error: unknown,
  t: (path: string) => string,
  fallbackKey: string,
): string {
  return error instanceof Error && error.message
    ? error.message
    : t(fallbackKey);
}
