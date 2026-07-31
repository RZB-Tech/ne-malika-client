"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminSettingsControllerGet,
  useAdminSettingsControllerUpdate,
} from "@/lib/api/generated/endpoints/settings/settings";
import { useT } from "@/components/providers/i18n-provider";

export default function AdminSettings() {
  const { t } = useT();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useAdminSettingsControllerGet({
    query: { retry: false },
  });
  const updateMutation = useAdminSettingsControllerUpdate();

  const toggleAiChecks = async (enabled: boolean) => {
    try {
      await updateMutation.mutateAsync({ data: { aiChecksEnabled: enabled } });
      await queryClient.invalidateQueries();
      toast.success(
        enabled ? "ИИ-проверка включена" : "ИИ-проверка выключена",
      );
    } catch {
      toast.error("Не удалось сохранить настройку");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.nav.settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Настройки платформы. Применяются сразу для всех продавцов.
        </p>
      </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить настройки. Раздел доступен только администраторам.
        </Card>
      )}

      <Card className="p-6">
        {isLoading || !settings ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <Label
                htmlFor="ai-checks"
                className="flex cursor-pointer items-center gap-2 font-medium"
              >
                <Sparkles className="size-4 text-primary" />
                ИИ-проверка товаров
              </Label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Каждый новый и отредактированный товар автоматически проверяется
                моделью: описание, согласованность данных и фотографии. При
                явном нарушении товар скрывается из выдачи до решения
                администратора. Если выключить — товары публикуются сразу,
                уже выполненные проверки остаются в истории.
              </p>
            </div>
            <Switch
              id="ai-checks"
              checked={settings.aiChecksEnabled}
              disabled={updateMutation.isPending}
              onCheckedChange={toggleAiChecks}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
