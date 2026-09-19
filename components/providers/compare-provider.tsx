"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useCompare as useCompareHook } from "@/lib/compare/use-compare";
import type { CompareProduct } from "@/lib/compare/local-compare";
import type { ProductSnapshot } from "@/lib/product-snapshot";

interface CompareContextValue {
  items: CompareProduct[];
  ids: number[];
  isFull: boolean;
  max: number;
  has: (id: number) => boolean;
  toggle: (product: ProductSnapshot) => boolean;
  remove: (id: number) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const compare = useCompareHook();

  // Fast O(1) Set lookup
  const idSet = useMemo(() => new Set(compare.ids), [compare.ids]);

  const value = useMemo<CompareContextValue>(
    () => ({
      ...compare,
      has: (id: number) => idSet.has(id),
    }),
    [compare, idSet],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
