"use client";

import { Cloud } from "@/components/icons";
import { useT } from "@/components/providers/i18n-provider";

/**
 * Плашка «где лежит список»: в браузере или уже в аккаунте. Общая для
 * избранного и истории просмотров — тексты берутся из неймспейса префикса
 * (`favorites.*` / `account.history.*`), набор ключей у обоих одинаковый.
 */
export function SyncNotice({
  isRemote,
  prefix,
}: {
  isRemote: boolean;
  prefix: string;
}) {
  const { t } = useT();

  return (
    <div className="flex items-start gap-3 rounded-xl bg-primary/5 px-4 py-3 text-sm">
      <Cloud className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="font-medium">
          {isRemote ? t(`${prefix}.syncedTitle`) : t(`${prefix}.localTitle`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRemote ? t(`${prefix}.syncedText`) : t(`${prefix}.localText`)}
        </p>
      </div>
    </div>
  );
}
