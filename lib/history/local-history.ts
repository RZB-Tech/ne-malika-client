"use client";

import { createLocalListStore } from "@/lib/storage/local-list-store";
import { isProductSnapshot, type ProductSnapshot } from "@/lib/product-snapshot";

/** Товар в локальной истории. */
export interface ViewedProduct extends ProductSnapshot {
  /** ISO-дата последнего просмотра. */
  viewedAt: string;
}

/** Потолок совпадает с ArrayMaxSize на бэкенде: всю историю шлём одним запросом. */
export const MAX_LOCAL_HISTORY = 100;

const store = createLocalListStore<ViewedProduct>({
  storageKey: "nemalika.viewHistory",
  isValid: (v): v is ViewedProduct =>
    isProductSnapshot(v) && typeof (v as ViewedProduct).viewedAt === "string",
});

export const getLocalHistory = store.get;
export const getEmptyHistory = store.getEmpty;
export const subscribeLocalHistory = store.subscribe;
export const removeLocalView = store.remove;
export const clearLocalHistory = store.clear;

/**
 * Записывает просмотр. Повторный заход поднимает товар наверх, а не добавляет
 * второй такой же — история отвечает на вопрос «что я смотрел», а не «сколько раз».
 */
export function recordLocalView(
  product: ProductSnapshot,
  viewedAt = new Date().toISOString(),
) {
  store.update((items) =>
    [{ ...product, viewedAt }, ...items.filter((p) => p.id !== product.id)].slice(
      0,
      MAX_LOCAL_HISTORY,
    ),
  );
}
