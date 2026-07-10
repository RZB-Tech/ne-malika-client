/** Счётчик Яндекс.Метрики. Публичный по своей природе — уезжает в HTML вместе со скриптом. */
export const METRIKA_COUNTER_ID = 110545926;

export type ContactKind = "phone" | "telegram";

/**
 * Адрес хита, которым мы отмечаем контакт с продавцом. Страницы по нему нет:
 * он существует только как строка в отчёте «Содержание → Популярное».
 *
 * Так сделано потому, что Метрика умеет точно ответить «сколько раз открыли
 * такой-то адрес», но не умеет — «сколько раз нажали кнопку на такой-то
 * странице»: цели считаются по визиту целиком, и клик на одной карточке
 * засчитывается всем карточкам, открытым в том же визите. Хит от этого свободен.
 *
 * Ровно эта же строка собирается на сервере в роуте статистики — держим их
 * согласованными, иначе продавец увидит нули.
 */
export function contactPath(
  productId: string | number,
  kind: ContactKind,
): string {
  return `/product/${productId}/contact/${kind}`;
}

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

/**
 * Отправить хит. Молча ничего не делает, если Метрика не загрузилась
 * (блокировщик, SSR, дев без сети) — аналитика не повод ронять обработчик клика.
 */
function hit(path: string, options?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.ym?.(METRIKA_COUNTER_ID, "hit", new URL(path, location.origin).href, options);
}

/**
 * Просмотр страницы при клиентской навигации. `init` в layout отправляет хит
 * только для страницы, с которой началась сессия, а переходы по `next/link`
 * Метрика не видит — она не следит за `history.pushState`.
 */
export function trackPageview(path: string, referer?: string): void {
  hit(path, referer ? { referer } : undefined);
}

/** Раскрытие телефона или переход в Telegram — считается как просмотр `contactPath`. */
export function trackContact(
  productId: string | number,
  kind: ContactKind,
): void {
  hit(contactPath(productId, kind));
}
