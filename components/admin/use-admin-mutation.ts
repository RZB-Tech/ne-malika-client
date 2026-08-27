"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";

export function useAdminMutation() {
  const { t } = useT();
  const queryClient = useQueryClient();

  return useCallback(
    async (
      action: () => Promise<unknown>,
      opts: {
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
