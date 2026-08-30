"use client";

/**
 * Яндекс.Метрика.
 *
 * Номер боевого счётчика лежит здесь значением по умолчанию, а не только в
 * переменной окружения. Причина простая: NEXT_PUBLIC_* вшивается на этапе
 * build, и незаданная переменная выключает счётчик молча — ни ошибки в логах
 * сборки, ни следа на странице. Один раз на этом уже потеряли вечер.
 *
 * NEXT_PUBLIC_YANDEX_METRIKA_ID остаётся как переопределение: свой номер для
 * превью-стенда либо 0, чтобы выключить счётчик совсем. Номер не секрет — он
 * и так виден в исходнике каждой страницы.
 *
 * Когда счётчика нет, все вызовы отсюда молча ничего не делают, поэтому код
 * в компонентах не обрастает проверками.
 *
 * Отдельно от lib/analytics.ts: там своя статистика товаров, она уходит на
 * собственный бэкенд и питает кабинет продавца. Метрика — про поведение
 * посетителя на сайте, данные не пересекаются.
 */

/** Боевой счётчик neMalika. */
const FALLBACK_ID = "110545926";

/** Номер счётчика — только цифры: он подставляется в инлайновый скрипт тега. */
const ID_PATTERN = /^\d+$/;

function readId(): string | null {
  const raw = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim();

  // Выключить счётчик совсем — на превью-стенде или на своей машине.
  if (raw === "0" || raw === "off") return null;

  // Свой счётчик вместо боевого.
  if (raw && ID_PATTERN.test(raw)) return raw;

  return FALLBACK_ID;
}

/** null — счётчик выключен. Строкой, потому что ym принимает и число, и строку. */
export const METRIKA_ID: string | null = readId();

export const METRIKA_ENABLED = METRIKA_ID !== null;

declare global {
  interface Window {
    ym?: (counter: string | number, method: string, ...args: unknown[]) => void;
  }
}

/**
 * Цели. Значения — идентификаторы, которые нужно завести в интерфейсе
 * Метрики («Настройка» → «Цели» → тип «JavaScript-событие»). Идентификатор
 * в Метрике обязан совпадать со строкой отсюда, иначе цель не засчитается.
 */
export const GOALS = {
  /** Покупатель раскрыл номер телефона продавца. */
  contactPhone: "contact_phone",
  /** Покупатель нажал «Написать в Telegram». */
  contactTelegram: "contact_telegram",
  /** Покупатель открыл переписку с продавцом на сайте. */
  chatStart: "chat_start",
  /** Поиск по каталогу. */
  search: "search",
  /** Товар добавлен в избранное (снятие не считаем). */
  favoriteAdd: "favorite_add",
  /** Вход через Telegram завершился успешно. */
  login: "login",
  /** Продавец завёл магазин. */
  shopCreated: "shop_created",
  /** Продавец опубликовал товар. */
  productCreated: "product_created",
  /** Продавец ушёл на страницу оплаты тарифа. */
  subscriptionCheckout: "subscription_checkout",
} as const;

export type Goal = (typeof GOALS)[keyof typeof GOALS];

function call(method: string, ...args: unknown[]): void {
  if (!METRIKA_ID || typeof window === "undefined") return;
  try {
    // Заглушка ym определяется синхронно вместе с тегом и копит вызовы,
    // пока не догрузится tag.js, — до готовности счётчика ничего не теряется.
    window.ym?.(METRIKA_ID, method, ...args);
  } catch {
    // Аналитика не повод ронять страницу: счётчик мог быть срезан блокировщиком.
  }
}

/**
 * Просмотр страницы. В Next.js переходы идут без перезагрузки, поэтому
 * init считает только первую страницу — остальные досылает MetrikaPageviews.
 */
export function hit(url: string, referer?: string): void {
  call("hit", url, referer ? { referer } : undefined);
}

/** Достижение цели. params попадают в отчёт «Параметры визитов». */
export function reachGoal(goal: Goal, params?: Record<string, unknown>): void {
  call("reachGoal", goal, params);
}

/**
 * Параметры визита — разрезы, по которым потом фильтруются отчёты
 * (язык интерфейса, роль вошедшего).
 */
export function setParams(params: Record<string, unknown>): void {
  call("params", params);
}

/** Идентификатор вошедшего: склеивает визиты одного человека с разных устройств. */
export function setUserId(id: number | string): void {
  call("setUserID", String(id));
}
