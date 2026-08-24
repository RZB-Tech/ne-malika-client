"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";

/**
 * Обёртка мутаций админских страниц: успех — точечная инвалидация затронутых
 * запросов и тост, ошибка — тост с текстом сервера.
 *
 * До неё почти каждая страница вызывала `invalidateQueries()` без фильтра —
 * любая мутация перезапрашивала весь кэш приложения, включая витринные
 * запросы покупателя. И почти нигде не было catch: ошибка мутации уходила в
 * тихий unhandled rejection, без тоста и без следа в консоли.
 */
export function useAdminMutation() {
  const { t } = useT();
  const queryClient = useQueryClient();

  return useCallback(
    async (
      action: () => Promise<unknown>,
      opts: {
        /** Базовые ключи затронутых запросов (фабрики orval). Пусто — нечего инвалидировать. */
        invalidate?: readonly (readonly unknown[])[];
        successKey?: string;
        errorKey: string;
      },
    ): Promise<boolean> => {
      try {
        await action();
        for (const key of opts.invalidate ?? []) {
          await queryClient.invalidateQueries({ queryKey: key });
        }
        if (opts.successKey) toast.success(t(opts.successKey));
        return true;
      } catch (err) {
        toast.error(apiErrorMessage(err, t, opts.errorKey));
        return false;
      }
    },
    [queryClient, t],
  );
}
