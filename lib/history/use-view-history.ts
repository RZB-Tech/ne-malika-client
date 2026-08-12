"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getProductViewsControllerFindMineQueryKey,
  useProductViewsControllerClear,
  useProductViewsControllerFindMine,
  useProductViewsControllerRemove,
  useProductViewsControllerSync,
} from "@/lib/api/generated/endpoints/me-product-views/me-product-views";
import type { ProductViewDto } from "@/lib/api/generated/schemas";
import { useAuth } from "@/lib/api/auth";
import {
  clearLocalHistory,
  getEmptyHistory,
  getLocalHistory,
  MAX_LOCAL_HISTORY,
  removeLocalView,
  subscribeLocalHistory,
  type ViewedProduct,
} from "./local-history";

/** Просмотренный товар в кабинете. `viewCount` есть только у серверных записей. */
export interface HistoryItem extends ViewedProduct {
  viewCount?: number;
}

/**
 * Кого уже синхронизировали в этой вкладке. Ключ — id пользователя: после
 * смены аккаунта историю устройства нужно перенести заново.
 */
const syncedUsers = new Set<number>();

function fromRemote(dto: ProductViewDto): HistoryItem {
  return {
    id: dto.id,
    shopId: dto.shopId,
    shopName: dto.shopName,
    name: dto.name,
    price: dto.price,
    photo: dto.photos?.[0] ?? null,
    state: dto.state,
    viewedAt: dto.viewedAt,
    viewCount: dto.viewCount,
  };
}

/**
 * История просмотров кабинета: локальная у анонима, серверная у вошедшего.
 *
 * Локальная копия пишется всегда и остаётся после выхода. У авторизованного
 * она один раз уезжает на бэкенд и дальше служит запасным вариантом — пока
 * запрос летит и если он не долетел.
 */
export function useViewHistory() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const queryClient = useQueryClient();

  const local = useSyncExternalStore(
    subscribeLocalHistory,
    getLocalHistory,
    getEmptyHistory,
  );

  const enabled = isHydrated && isAuthenticated;

  const remote = useProductViewsControllerFindMine(
    { limit: MAX_LOCAL_HISTORY },
    { query: { enabled } },
  );

  const { mutateAsync: syncViews, isPending: isSyncing } =
    useProductViewsControllerSync();
  const { mutateAsync: removeRemote } = useProductViewsControllerRemove();
  const { mutateAsync: clearRemote } = useProductViewsControllerClear();

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: getProductViewsControllerFindMineQueryKey(),
      }),
    [queryClient],
  );

  useEffect(() => {
    const userId = user?.id;
    if (!enabled || userId === undefined || syncedUsers.has(userId)) return;

    const items = getLocalHistory();
    syncedUsers.add(userId);
    if (items.length === 0) return;

    syncViews({
      data: {
        items: items.map((p) => ({
          product_card_id: p.id,
          viewed_at: p.viewedAt,
        })),
      },
    })
      .then(() => invalidate())
      .catch(() => {
        syncedUsers.delete(userId);
      });
  }, [enabled, user?.id, syncViews, invalidate]);

  const items: HistoryItem[] = useMemo(() => {
    if (!enabled) return local;
    const data = remote.data?.data;
    return data ? data.map(fromRemote) : local;
  }, [enabled, local, remote.data]);

  const remove = useCallback(
    async (id: number) => {
      removeLocalView(id);
      if (!enabled) return;
      await removeRemote({ productCardId: id }).catch(() => undefined);
      await invalidate();
    },
    [enabled, removeRemote, invalidate],
  );

  const clear = useCallback(async () => {
    clearLocalHistory();
    if (!enabled) return;
    await clearRemote().catch(() => undefined);
    await invalidate();
  }, [enabled, clearRemote, invalidate]);

  return {
    items,
    /** Скелет показываем только на первом запросе, а не на фоновых обновлениях. */
    isLoading: enabled && remote.isPending,
    isSyncing,
    /** История уже общая для всех устройств. */
    isRemote: enabled && Boolean(remote.data),
    remove,
    clear,
  };
}
