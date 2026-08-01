"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
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

/**
 * Кого уже синхронизировали в этой вкладке. Ключ — id пользователя: после
 * смены аккаунта избранное устройства нужно перенести заново.
 */
const syncedUsers = new Set<number>();

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
 * Устроено как история просмотров — локальная копия пишется всегда, после
 * входа один раз уезжает на бэкенд и дальше служит запасным вариантом, пока
 * запрос летит и если он не долетел.
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
    { limit: 100 },
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

  // Перенос избранного устройства сразу после входа — один раз на аккаунт.
  useEffect(() => {
    const userId = user?.id;
    if (!enabled || userId === undefined || syncedUsers.has(userId)) return;

    const items = getLocalFavorites();
    // Отметку ставим до запроса: в StrictMode эффект выполняется дважды.
    syncedUsers.add(userId);
    if (items.length === 0) return;

    syncFavorites({
      data: {
        items: items.slice(0, MAX_LOCAL_FAVORITES).map((p) => ({
          product_card_id: p.id,
          added_at: p.addedAt,
        })),
      },
    })
      .then(() => invalidate())
      .catch(() => {
        // Бэкенд недоступен — попробуем на следующем заходе, а пока в кабинете
        // останется локальное избранное.
        syncedUsers.delete(userId);
      });
  }, [enabled, user?.id, syncFavorites, invalidate]);

  const items: FavoriteProduct[] = useMemo(() => {
    if (!enabled) return local;
    const data = remote.data?.data;
    return data ? data.map(fromRemote) : local;
  }, [enabled, local, remote.data]);

  // Признак «в избранном» читаем из локальной копии всегда: она обновляется
  // мгновенно, поэтому сердце закрашивается по нажатию, не дожидаясь ответа.
  const has = useCallback(
    (id: number) =>
      items.some((p) => p.id === id) || local.some((p) => p.id === id),
    [items, local],
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

  const remove = useCallback(
    async (id: number) => {
      removeLocalFavorite(id);
      if (!enabled) return;
      // 404 здесь — норма: товара могло не быть в серверном списке.
      await removeRemote({ productCardId: id }).catch(() => undefined);
      await invalidate();
    },
    [enabled, removeRemote, invalidate],
  );

  const toggle = useCallback(
    async (product: ProductSnapshot) => {
      if (has(product.id)) {
        await remove(product.id);
        return false;
      }
      return add(product);
    },
    [has, add, remove],
  );

  const clear = useCallback(async () => {
    clearLocalFavorites();
    if (!enabled) return;
    await clearRemote().catch(() => undefined);
    await invalidate();
  }, [enabled, clearRemote, invalidate]);

  return {
    items,
    count: items.length,
    isLoading: enabled && remote.isPending,
    /** Избранное уже общее для всех устройств. */
    isRemote: enabled && Boolean(remote.data),
    has,
    add,
    remove,
    toggle,
    clear,
  };
}
