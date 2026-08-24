"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getFavoritesControllerFindMineQueryKey,
  useFavoritesControllerAdd,
  useFavoritesControllerClear,
  useFavoritesControllerFindMine,
  useFavoritesControllerRemove,
  useFavoritesControllerSync,
} from "@/lib/api/generated/endpoints/me-favorites/me-favorites";
import type { FavoriteDto } from "@/lib/api/generated/schemas";
import { useAuth } from "@/lib/api/auth";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import { useRemoteBackedList } from "@/lib/remote-backed-list";
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

/**
 * Избранное: локальное у анонима, серверное у вошедшего.
 *
 * Устроено как история просмотров — общая механика в `useRemoteBackedList`:
 * локальная копия пишется всегда, после входа один раз уезжает на бэкенд и
 * дальше служит запасным вариантом, пока запрос летит и если он не долетел.
 */
export function useFavorites() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const queryClient = useQueryClient();

  const local = useSyncExternalStore(
    subscribeLocalFavorites,
    getLocalFavorites,
    getEmptyFavorites,
  );

  const enabled = isHydrated && isAuthenticated;

  const remote = useFavoritesControllerFindMine(
    // Кап совпадает с локальным и бэкендом: меньше — и has() у активных
    // пользователей врёт, а toggle перезаписывает уже избранное.
    { limit: MAX_LOCAL_FAVORITES },
    { query: { enabled } },
  );

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
    (id: number) =>
      list.items.some((p) => p.id === id) || local.some((p) => p.id === id),
    [list.items, local],
  );

  const add = useCallback(
    async (product: ProductSnapshot) => {
      const added = addLocalFavorite(product);
      if (!added) return false;
      if (enabled) {
        await addRemote({ data: { product_card_id: product.id } }).catch(
          () => undefined,
        );
        await invalidate();
      }
      return true;
    },
    [enabled, addRemote, invalidate],
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
    /** Избранное уже общее для всех устройств. */
    isRemote: list.isRemote,
    has,
    add,
    remove: list.remove,
    toggle,
    clear: list.clear,
  };
}
