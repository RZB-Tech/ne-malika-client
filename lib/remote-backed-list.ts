"use client";

import { useCallback, useEffect, useMemo } from "react";

/**
 * Кого уже синхронизировали в этой вкладке. Ключ — `список:id пользователя`:
 * после смены аккаунта локальные данные нужно перенести заново, а у каждого
 * списка свой зачёт — синк избранного мог пройти, а истории упасть.
 * Модульный уровень, а не состояние хука: StrictMode монтирует эффект дважды,
 * и без этого список уезжал бы на бэкенд по два раза.
 */
const syncedUsers = new Set<string>();

/**
 * Общая механика «локальный список + серверная копия», общая для избранного и
 * истории просмотров: локальная копия пишется всегда, после входа один раз
 * уезжает на бэкенд и дальше служит запасным вариантом, пока запрос летит и
 * если он не долетел.
 *
 * Раньше у каждого хука была своя копия этой логики — правки (кап лимита,
 * семантика ретраев) приходилось вносить дважды, и они расходились.
 */
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
  /** Имя списка: «favorites», «viewHistory» — для учёта синхронизаций. */
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
    /** Скелет показываем только на первом запросе, а не на фоновых обновлениях. */
    isLoading: enabled && isPending,
    /** Список уже общий для всех устройств. */
    isRemote: enabled && Boolean(remoteData),
    remove,
    clear,
  };
}
