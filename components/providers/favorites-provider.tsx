"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useFavorites as useFavoritesHook } from "@/lib/favorites/use-favorites";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import type { FavoriteProduct } from "@/lib/favorites/local-favorites";

interface FavoritesContextValue {
  items: FavoriteProduct[];
  count: number;
  isLoading: boolean;
  isRemote: boolean;
  has: (id: number) => boolean;
  add: (product: ProductSnapshot) => Promise<boolean>;
  remove: (id: number) => Promise<void>;
  toggle: (product: ProductSnapshot) => Promise<boolean>;
  clear: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favorites = useFavoritesHook();

  // Fast O(1) Set lookup for has(id)
  const idSet = useMemo(() => new Set(favorites.items.map((i) => i.id)), [favorites.items]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ...favorites,
      has: (id: number) => idSet.has(id),
    }),
    [favorites, idSet],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
