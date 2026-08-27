"use client";

import { useCallback, useEffect, useMemo } from "react";

const syncedUsers = new Set<string>();

export function useRemoteBackedList<TItem extends { id: number }, TDto>({
  listKey,
  user,
  enabled,
  local,
  getLocal,
  removeLocal,
  clearLocal,
  remoteData,
  isPending,
  fromRemote,
  sync,
  invalidate,
  removeRemote,
  clearRemote,
}: {
  listKey: string;
  user: { id?: number } | null;
  enabled: boolean;
  local: TItem[];
  getLocal: () => TItem[];
  removeLocal: (id: number) => void;
  clearLocal: () => void;
  remoteData: TDto[] | undefined;
  isPending: boolean;
  fromRemote: (dto: TDto) => TItem;
  sync: (items: TItem[]) => Promise<unknown>;
  invalidate: () => Promise<unknown>;
  removeRemote: (id: number) => Promise<unknown>;
  clearRemote: () => Promise<unknown>;
}) {
  useEffect(() => {
    const userId = user?.id;
    if (!enabled || userId === undefined) return;

    const key = `${listKey}:${userId}`;
    if (syncedUsers.has(key)) return;

    const items = getLocal();
    syncedUsers.add(key);
    if (items.length === 0) return;

    sync(items)
      .then(() => invalidate())
      .catch(() => {
        syncedUsers.delete(key);
      });
  }, [enabled, user?.id, listKey, getLocal, sync, invalidate]);

  const items = useMemo(() => {
    if (!enabled) return local;
    return remoteData ? remoteData.map(fromRemote) : local;
  }, [enabled, local, remoteData, fromRemote]);

  const remove = useCallback(
    async (id: number) => {
      removeLocal(id);
      if (!enabled) return;
      await removeRemote(id).catch(() => undefined);
      await invalidate();
    },
    [enabled, removeLocal, removeRemote, invalidate],
  );

  const clear = useCallback(async () => {
    clearLocal();
    if (!enabled) return;
    await clearRemote().catch(() => undefined);
    await invalidate();
  }, [enabled, clearLocal, clearRemote, invalidate]);

  return {
    items,
    isLoading: enabled && isPending,
    isRemote: enabled && Boolean(remoteData),
    remove,
    clear,
  };
}
