"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addToCompare,
  clearCompare,
  getEmptyCompare,
  getLocalCompare,
  MAX_COMPARE,
  removeFromCompare,
  subscribeLocalCompare,
  type CompareProduct,
} from "./local-compare";
import type { ProductSnapshot } from "@/lib/product-snapshot";

/**
 * Список сравнения. Целиком локальный — синхронизировать с бэкендом здесь
 * нечего: выбор живёт минуты, а не между устройствами.
 */
export function useCompare() {
  const items = useSyncExternalStore(
    subscribeLocalCompare,
    getLocalCompare,
    getEmptyCompare,
  );

  const toggle = useCallback((product: ProductSnapshot): boolean => {
    if (getLocalCompare().some((p) => p.id === product.id)) {
      removeFromCompare(product.id);
      return false;
    }
    return addToCompare(product);
  }, []);

  return {
    items: items as CompareProduct[],
    ids: items.map((p) => p.id),
    isFull: items.length >= MAX_COMPARE,
    max: MAX_COMPARE,
    has: (id: number) => items.some((p) => p.id === id),
    toggle,
    remove: removeFromCompare,
    clear: clearCompare,
  };
}
