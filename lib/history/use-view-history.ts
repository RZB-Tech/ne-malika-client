"use client";

import { useCallback, useSyncExternalStore } from "react";
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
import { useRemoteBackedList } from "@/lib/remote-backed-list";
import {
  clearLocalHistory,
  getEmptyHistory,
  getLocalHistory,
  MAX_LOCAL_HISTORY,
  removeLocalView,
  subscribeLocalHistory,
  type ViewedProduct,
} from "./local-history";

export interface HistoryItem extends ViewedProduct {
  viewCount?: number;
}

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

export function useViewHistory() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const queryClient = useQueryClient();

  const local = useSyncExternalStore(subscribeLocalHistory, getLocalHistory, getEmptyHistory);

  const enabled = isHydrated && isAuthenticated;

  const remote = useProductViewsControllerFindMine(
    { limit: MAX_LOCAL_HISTORY },
    { query: { enabled } },
  );

  const { mutateAsync: syncViews, isPending: isSyncing } = useProductViewsControllerSync();
  const { mutateAsync: removeRemote } = useProductViewsControllerRemove();
  const { mutateAsync: clearRemote } = useProductViewsControllerClear();

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: getProductViewsControllerFindMineQueryKey(),
      }),
    [queryClient],
  );

  const sync = useCallback(
    (items: ViewedProduct[]) =>
      syncViews({
        data: {
          items: items.map((p) => ({
            product_card_id: p.id,
            viewed_at: p.viewedAt,
          })),
        },
      }),
    [syncViews],
  );

  const list = useRemoteBackedList<HistoryItem, ProductViewDto>({
    listKey: "viewHistory",
    user,
    enabled,
    local,
    getLocal: getLocalHistory,
    removeLocal: removeLocalView,
    clearLocal: clearLocalHistory,
    remoteData: remote.data?.data,
    isPending: remote.isPending,
    fromRemote,
    sync,
    invalidate,
    removeRemote: (id) => removeRemote({ productCardId: id }),
    clearRemote: () => clearRemote(),
  });

  return {
    items: list.items,
    isLoading: list.isLoading,
    isSyncing,
    isRemote: list.isRemote,
    remove: list.remove,
    clear: list.clear,
  };
}
