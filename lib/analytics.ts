import { productStatsControllerRecord } from "./api/generated/endpoints/product-stats/product-stats";
import type { RecordProductEventDtoKind } from "./api/generated/schemas";
import { GOALS, reachGoal, type Goal } from "./metrika";

const VISITOR_KEY = "nm_visitor_id";

export type ContactKind = "phone" | "telegram";

export function visitorId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;

    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

function send(productId: string | number, kind: RecordProductEventDtoKind): void {
  const visitor = visitorId();
  if (!visitor) return;

  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return;

  void productStatsControllerRecord(id, {
    kind,
    visitor_id: visitor,
  }).catch(() => {});
}

export function trackProductView(productId: string | number): void {
  send(productId, "view");
}

const CONTACT_GOAL: Record<ContactKind, Goal> = {
  phone: GOALS.contactPhone,
  telegram: GOALS.contactTelegram,
};

/**
 * Контакт с продавцом — главное целевое действие витрины. Уходит в две
 * стороны сразу: в свою статистику (её видит продавец в кабинете) и целью
 * в Метрику (её видим мы в отчётах по источникам трафика).
 */
export function trackContact(productId: string | number, kind: ContactKind): void {
  send(productId, kind);
  reachGoal(CONTACT_GOAL[kind], { productId: Number(productId) || undefined });
}
