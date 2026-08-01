"use client";

// Избранное устройства. Устроено как история просмотров, но кладут сюда
// осознанно, поэтому повторное нажатие на сердце не меняет дату — список
// отсортирован по тому, когда товар добавили.

import { createLocalListStore } from "@/lib/storage/local-list-store";
import { isProductSnapshot, type ProductSnapshot } from "@/lib/product-snapshot";

export interface FavoriteProduct extends ProductSnapshot {
  /** ISO-дата добавления в избранное. */
  addedAt: string;
}

/** Совпадает с ArrayMaxSize на бэкенде: всё избранное уезжает одним запросом. */
export const MAX_LOCAL_FAVORITES = 200;

const store = createLocalListStore<FavoriteProduct>({
  storageKey: "nemalika.favorites",
  isValid: (v): v is FavoriteProduct =>
    isProductSnapshot(v) && typeof (v as FavoriteProduct).addedAt === "string",
});

export const getLocalFavorites = store.get;
export const getEmptyFavorites = store.getEmpty;
export const subscribeLocalFavorites = store.subscribe;
export const isLocalFavorite = store.has;
export const removeLocalFavorite = store.remove;
export const clearLocalFavorites = store.clear;

/** Возвращает false, если товар уже в избранном или список переполнен. */
export function addLocalFavorite(
  product: ProductSnapshot,
  addedAt = new Date().toISOString(),
): boolean {
  if (store.has(product.id)) return false;
  if (store.get().length >= MAX_LOCAL_FAVORITES) return false;

  store.update((items) => [{ ...product, addedAt }, ...items]);
  return true;
}
