"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
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

  const ids = useMemo(() => items.map((p) => p.id), [items]);
  const has = useCallback(
    (id: number) => items.some((p) => p.id === id),
    [items],
  );

  return {
    items: items as CompareProduct[],
    ids,
    isFull: items.length >= MAX_COMPARE,
    max: MAX_COMPARE,
    has,
    toggle,
    remove: removeFromCompare,
    clear: clearCompare,
  };
}
