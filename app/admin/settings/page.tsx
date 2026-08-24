"use client";

import { useState } from "react";
import { Coins, Sparkles } from "@/components/icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminSettingsControllerGetQueryKey,
  useAdminSettingsControllerGet,
  useAdminSettingsControllerUpdate,
} from "@/lib/api/generated/endpoints/settings/settings";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { useT } from "@/components/providers/i18n-provider";

export default function AdminSettings() {
  const { t } = useT();
  const run = useAdminMutation();

  const { data: settings, isLoading, isError } = useAdminSettingsControllerGet({
    query: { retry: false },
  });
  const updateMutation = useAdminSettingsControllerUpdate();

  const [markup, setMarkup] = useState<string | null>(null);
  const markupValue = markup ?? String(settings?.creditMarkup ?? 2);

  const saveMarkup = async () => {
    const parsed = Number(markupValue);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error(t("admin.settings.saveFailed"));
      setMarkup(null);
      return;
    }
    if (settings && parsed === settings.creditMarkup) return;
    const ok = await run(
      () =>
        updateMutation.mutateAsync({
          data: {
            aiChecksEnabled: settings?.aiChecksEnabled ?? true,
            creditMarkup: parsed,
          },
        }),
      {
        invalidate: [getAdminSettingsControllerGetQueryKey()],
        successKey: "admin.imageGen.saved",
        errorKey: "admin.settings.saveFailed",
      },
    );
    if (ok) setMarkup(null);
  };

  const toggleAiChecks = (enabled: boolean) =>
    run(
      () => updateMutation.mutateAsync({ data: { aiChecksEnabled: enabled } }),
      {
        invalidate: [getAdminSettingsControllerGetQueryKey()],
        successKey: enabled ? "admin.settings.aiOn" : "admin.settings.aiOff",
        errorKey: "admin.settings.saveFailed",
      },
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.nav.settings")}
        subtitle={t("admin.settings.subtitle")}
      />

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.settings.loadFailed")}
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
                {t("admin.settings.aiTitle")}
              </Label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("admin.settings.aiText")}
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

      <Card className="p-6">
        {isLoading || !settings ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="markup" className="flex items-center gap-2 font-medium">
                <Coins className="size-4 text-primary" />
                {t("admin.credits.markupTitle")}
              </Label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("admin.credits.markupText")}
              </p>
            </div>
            <div className="w-32 shrink-0 space-y-1.5">
              <Label htmlFor="markup" className="text-xs text-muted-foreground">
                {t("admin.credits.markupLabel")}
              </Label>
              <Input
                id="markup"
                inputMode="decimal"
                className="tabular"
                value={markupValue}
                onChange={(e) => setMarkup(e.target.value.replace(/[^\d.]/g, ""))}
                onBlur={saveMarkup}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
