"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { getCurrentUser, getSessionVersion, subscribe } from "@/lib/api/token-store";

const syncedLists = new Set<string>();
let syncSession = getSessionVersion();

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
  const session = useSyncExternalStore(subscribe, getSessionVersion, () => 0);
  const isCurrent = useCallback(
    () => getSessionVersion() === session && getCurrentUser()?.id === user?.id,
    [session, user?.id],
  );

  useEffect(() => {
    const userId = user?.id;
    if (!enabled || userId === undefined || !isCurrent()) return;
    if (syncSession !== session) {
      syncedLists.clear();
      syncSession = session;
    }

    const key = `${listKey}:${session}:${userId}`;
    if (syncedLists.has(key)) return;

    const items = getLocal();
    syncedLists.add(key);
    if (items.length === 0) return;

    sync(items)
      .then(() => {
        if (!isCurrent()) return;
        return invalidate();
      })
      .catch(() => {
        syncedLists.delete(key);
      });
  }, [enabled, user?.id, listKey, getLocal, removeLocal, sync, invalidate, session, isCurrent]);

  const items = useMemo(() => {
    if (!enabled) return local;
    return remoteData ? remoteData.map(fromRemote) : local;
  }, [enabled, local, remoteData, fromRemote]);

  const remove = useCallback(
    async (id: number) => {
      if (!isCurrent()) return;
      removeLocal(id);
      if (!enabled) return;
      await removeRemote(id).catch(() => undefined);
      if (isCurrent()) await invalidate();
    },
    [enabled, removeLocal, removeRemote, invalidate, isCurrent],
  );

  const clear = useCallback(async () => {
    if (!isCurrent()) return;
    clearLocal();
    if (!enabled) return;
    await clearRemote().catch(() => undefined);
    if (isCurrent()) await invalidate();
  }, [enabled, clearLocal, clearRemote, invalidate, isCurrent]);

  return {
    items,
    isLoading: enabled && isPending,
    isRemote: enabled && Boolean(remoteData),
    remove,
    clear,
  };
}
