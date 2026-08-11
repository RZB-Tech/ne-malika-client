"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminImageGenControllerAccess,
  useAdminImageGenControllerSetAccess,
} from "@/lib/api/generated/endpoints/image-gen-admin/image-gen-admin";
import { useT } from "@/components/providers/i18n-provider";

interface Quota {
  allowed: boolean;
  limit: number | null;
  used: number;
}

/**
 * Выдача продавцу доступа к генерации карточек и потолка по числу картинок.
 *
 * Пустое поле лимита — это «безлимитно», а не ноль: ноль означал бы «доступ
 * выдан и тут же исчерпан», и такую настройку невозможно было бы отличить от
 * опечатки. Расход считается за всё время, а не за месяц — чтобы поднять
 * потолок, администратор просто вписывает большее число.
 */
export function ImageGenAccess({ userId }: { userId: number }) {
  const { t } = useT();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } =
    useAdminImageGenControllerAccess(userId, { query: { retry: false } });
  const quota = data as unknown as Quota | undefined;
  const saveMutation = useAdminImageGenControllerSetAccess();

  // Форма наполняется из ответа один раз: пока админ правит поля, приходящие
  // рефетчи не должны затирать несохранённый ввод.
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [limit, setLimit] = useState<string | null>(null);

  const enabledValue = enabled ?? quota?.allowed ?? false;
  const limitValue =
    limit ?? (quota?.limit === null || quota?.limit === undefined ? "" : String(quota.limit));

  const save = async () => {
    const trimmed = limitValue.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      toast.error(t("admin.imageGen.saveFailed"));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        userId,
        data: { enabled: enabledValue, limit: parsed },
      });
      await queryClient.invalidateQueries();
      setEnabled(null);
      setLimit(null);
      toast.success(t("admin.imageGen.saved"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.imageGen.saveFailed"),
      );
    }
  };

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  // Без этой ветки форма рисовала «выключено, использовано 0» на любой ошибке
  // загрузки — выдуманные цифры, которые администратор мог сохранить поверх
  // настоящего лимита.
  if (isError || !quota) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">
          {t("admin.imageGen.loadFailed")}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          {t("admin.imageGen.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("admin.imageGen.description")}
      </p>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`image-gen-${userId}`} className="cursor-pointer">
          {t("admin.imageGen.enabled")}
        </Label>
        <Switch
          id={`image-gen-${userId}`}
          checked={enabledValue}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabledValue && (
        <div className="space-y-1.5">
          <Label htmlFor={`image-gen-limit-${userId}`}>
            {t("admin.imageGen.limit")}
          </Label>
          <Input
            id={`image-gen-limit-${userId}`}
            inputMode="numeric"
            value={limitValue}
            onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
            placeholder={t("admin.imageGen.limitPlaceholder")}
            className="tabular"
          />
          <p className="text-xs text-muted-foreground">
            {t("admin.imageGen.limitHint")}
          </p>
        </div>
      )}

      {/* Безлимит и выключенный доступ раньше выглядели одинаково — просто
          «Использовано: N», и отличить одно от другого было нельзя. */}
      <p className="tabular text-sm text-muted-foreground">
        {!quota.allowed
          ? `${t("admin.imageGen.used", { used: quota.used })} · ${t("admin.imageGen.disabled")}`
          : quota.limit === null
            ? `${t("admin.imageGen.used", { used: quota.used })} · ${t("admin.imageGen.unlimited")}`
            : t("admin.imageGen.usedOf", {
                used: quota.used,
                limit: quota.limit,
              })}
      </p>

      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={saveMutation.isPending}
      >
        {t("admin.imageGen.save")}
      </Button>
    </div>
  );
}
