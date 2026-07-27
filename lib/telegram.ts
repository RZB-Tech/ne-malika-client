// Разбор пользовательского ввода Telegram в чистый username.
// Продавец может вставить что угодно: полную ссылку, t.me/…, @username,
// tg://resolve?domain=…, ссылку с параметрами. Хранить и показывать нужно
// только username — из него потом собирается кнопка перехода.

const USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/;

/**
 * Извлекает username из любого формата. Возвращает username без "@" и без
 * ссылки, либо null, если распознать не удалось.
 *
 * Понимает: "@name", "name", "https://t.me/name", "t.me/name/",
 * "https://telegram.me/name?start=1", "tg://resolve?domain=name".
 * Не трогает ссылки на приглашения ("t.me/+abc", "t.me/joinchat/…") —
 * это не публичный username, их возвращаем как null.
 */
export function parseTelegramUsername(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let candidate = raw;

  // tg://resolve?domain=username
  const tgMatch = raw.match(/domain=([a-zA-Z0-9_]+)/i);
  if (tgMatch) {
    candidate = tgMatch[1];
  } else if (/t(?:elegram)?\.me\//i.test(raw) || /^https?:\/\//i.test(raw)) {
    // Любая ссылка t.me / telegram.me — берём первый сегмент пути.
    const afterHost = raw.replace(/^https?:\/\//i, "").replace(/^[^/]*\//, "");
    candidate = afterHost.split(/[/?#]/)[0] ?? "";
  }

  candidate = candidate.replace(/^@/, "");

  // Приглашения и служебные пути — не публичный username.
  if (candidate.startsWith("+") || /^joinchat$/i.test(candidate)) return null;

  return USERNAME_RE.test(candidate) ? candidate : null;
}

/** Публичная ссылка на диалог из username. */
export function telegramUrl(username: string): string {
  return `https://t.me/${username.replace(/^@/, "")}`;
}
