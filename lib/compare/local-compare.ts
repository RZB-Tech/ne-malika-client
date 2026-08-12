"use client";

import { createLocalListStore } from "@/lib/storage/local-list-store";
import { isProductSnapshot, type ProductSnapshot } from "@/lib/product-snapshot";

export interface CompareProduct extends ProductSnapshot {
  addedAt: string;
}

/** Больше четырёх колонок таблица не выдержит даже на широком экране. */
export const MAX_COMPARE = 4;

const store = createLocalListStore<CompareProduct>({
  storageKey: "nemalika.compare",
  isValid: (v): v is CompareProduct =>
    isProductSnapshot(v) && typeof (v as CompareProduct).addedAt === "string",
});

export const getLocalCompare = store.get;
export const getEmptyCompare = store.getEmpty;
export const subscribeLocalCompare = store.subscribe;
export const isInCompare = store.has;
export const removeFromCompare = store.remove;
export const clearCompare = store.clear;

/** Возвращает false, если товар уже выбран или мест больше нет. */
export function addToCompare(
  product: ProductSnapshot,
  addedAt = new Date().toISOString(),
): boolean {
  if (store.has(product.id)) return false;
  if (store.get().length >= MAX_COMPARE) return false;

  store.update((items) => [...items, { ...product, addedAt }]);
  return true;
}
