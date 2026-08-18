import { productStatsControllerRecord } from "./api/generated/endpoints/product-stats/product-stats";
import type { RecordProductEventDtoKind } from "./api/generated/schemas";

/**
 * Счётчик просмотров и контактов. Считает наш бэкенд, а не внешняя аналитика:
 * цифры нужны продавцу в кабинете сразу, без задержки обработки и без квоты
 * на чтение чужого API.
 */

const VISITOR_KEY = "nm_visitor_id";

export type ContactKind = "phone" | "telegram";

/**
 * Идентификатор браузера, общий для всех вкладок и живущий между визитами.
 *
 * localStorage, а не кука: обычные запросы клиента идут без `credentials`, и
 * серверная кука до API не доехала бы — пришлось бы включать её глобально и
 * трогать авторизацию ради счётчика. Здесь же уже лежит история просмотров
 * анонима до входа, так что место привычное.
 *
 * Значение ни на что не влияет, кроме склейки повторных заходов: подделав его,
 * посетитель испортит статистику той карточки, которую сам и смотрит.
 */
function visitorId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;

    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // Приватный режим и запрет хранилища: считать просмотр всё равно надо,
    // просто повторы этого посетителя схлопнуть не выйдет.
    return null;
  }
}

/**
 * Отправить событие. Никогда не бросает: аналитика не повод ронять открытие
 * страницы или обработчик клика, а сеть у посетителя может отвалиться в любой
 * момент.
 */
function send(
  productId: string | number,
  kind: RecordProductEventDtoKind,
): void {
  const visitor = visitorId();
  if (!visitor) return;

  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return;

  void productStatsControllerRecord(id, {
    kind,
    visitor_id: visitor,
  }).catch(() => {});
}

/** Открытие карточки товара. */
export function trackProductView(productId: string | number): void {
  send(productId, "view");
}

/** Раскрытие телефона или переход в Telegram. */
export function trackContact(
  productId: string | number,
  kind: ContactKind,
): void {
  send(productId, kind);
}
