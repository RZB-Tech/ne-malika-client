"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFavoritesControllerFindMineQueryKey,
  useFavoritesControllerAdd,
  useFavoritesControllerClear,
  useFavoritesControllerRemove,
  useFavoritesControllerSync,
} from "@/lib/api/generated/endpoints/me-favorites/me-favorites";
import type { FavoriteDto } from "@/lib/api/generated/schemas";
import { useAuth } from "@/lib/api/auth";
import { getSessionVersion, subscribe } from "@/lib/api/token-store";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import { useRemoteBackedList } from "@/lib/remote-backed-list";
import { fetchAllFavorites } from "./fetch-favorites";
import {
  addLocalFavorite,
  clearLocalFavorites,
  getEmptyFavorites,
  getLocalFavorites,
  MAX_LOCAL_FAVORITES,
  removeLocalFavorite,
  subscribeLocalFavorites,
  type FavoriteProduct,
} from "./local-favorites";

function fromRemote(dto: FavoriteDto): FavoriteProduct {
  return {
    id: dto.id,
    shopId: dto.shopId,
    shopName: dto.shopName,
    name: dto.name,
    price: dto.price,
    photo: dto.photos?.[0] ?? null,
    state: dto.state,
    addedAt: dto.addedAt,
  };
}

export function useFavorites() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const queryClient = useQueryClient();
  const session = useSyncExternalStore(subscribe, getSessionVersion, () => 0);

  const local = useSyncExternalStore(subscribeLocalFavorites, getLocalFavorites, getEmptyFavorites);

  const enabled = isHydrated && isAuthenticated;

  const remote = useQuery({
    queryKey: [...getFavoritesControllerFindMineQueryKey(), "all", user?.id],
    enabled,
    queryFn: ({ signal }) => fetchAllFavorites(signal),
  });
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (getSessionVersion() !== session) {
        queryClient.removeQueries({ queryKey: [...getFavoritesControllerFindMineQueryKey(), "all"] });
      }
    });
    return unsubscribe;
  }, [queryClient, session]);

  const { mutateAsync: syncFavorites } = useFavoritesControllerSync();
  const { mutateAsync: addRemote } = useFavoritesControllerAdd();
  const { mutateAsync: removeRemote } = useFavoritesControllerRemove();
  const { mutateAsync: clearRemote } = useFavoritesControllerClear();

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: getFavoritesControllerFindMineQueryKey(),
      }),
    [queryClient],
  );

  const sync = useCallback(
    (items: FavoriteProduct[]) =>
      syncFavorites({
        data: {
          items: items.slice(0, MAX_LOCAL_FAVORITES).map((p) => ({
            product_card_id: p.id,
            added_at: p.addedAt,
          })),
        },
      }),
    [syncFavorites],
  );

  const list = useRemoteBackedList<FavoriteProduct, FavoriteDto>({
    listKey: "favorites",
    user,
    enabled,
    local,
    getLocal: getLocalFavorites,
    removeLocal: removeLocalFavorite,
    clearLocal: clearLocalFavorites,
    remoteData: remote.data?.data,
    isPending: remote.isPending,
    fromRemote,
    sync,
    invalidate,
    removeRemote: (id) => removeRemote({ productCardId: id }),
    clearRemote: () => clearRemote(),
  });

  const has = useCallback(
    (id: number) => list.items.some((p) => p.id === id),
    [list.items],
  );

  const add = useCallback(
    async (product: ProductSnapshot) => {
      if (getSessionVersion() !== session) return false;
      if (!enabled) return addLocalFavorite(product);
      try {
        await addRemote({ data: { product_card_id: product.id } });
        if (getSessionVersion() !== session) return false;
        await invalidate();
        return getSessionVersion() === session;
      } catch {
        return false;
      }
    },
    [enabled, addRemote, invalidate, session],
  );

  const { remove: removeItem } = list;

  const toggle = useCallback(
    async (product: ProductSnapshot) => {
      if (has(product.id)) {
        await removeItem(product.id);
        return false;
      }
      return add(product);
    },
    [has, add, removeItem],
  );

  return {
    items: list.items,
    count: list.items.length,
    isLoading: list.isLoading,
    isRemote: list.isRemote,
    has,
    add,
    remove: list.remove,
    toggle,
    clear: list.clear,
  };
}
