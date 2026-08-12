"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminCreditsControllerBalance,
  useAdminCreditsControllerGrant,
  useAdminCreditsPreviewControllerPreview,
} from "@/lib/api/generated/endpoints/credits-admin/credits-admin";
import { useT } from "@/components/providers/i18n-provider";

interface Balance {
  balance: number;
  reserved: number;
  available: number;
}

/**
 * Выдача кредитов магазину.
 *
 * Администратор вводит сумму, которую заплатил магазин, а начисляется она
 * делённой на множитель наценки из настроек: $20 при множителе 2 дают $10
 * доступного расхода. Сколько именно получится, считает сервер и показывает
 * до нажатия — множитель хранится в настройках и клиент его не угадывает.
 */
export function GrantCreditsDialog({
  shop,
  onClose,
}: {
  shop: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const open = shop !== null;
  const shopId = shop?.id ?? 0;
  const parsed = Number(amount);
  const validAmount = Number.isFinite(parsed) && parsed >= 1;

  const balanceQuery = useAdminCreditsControllerBalance(shopId, {
    query: { enabled: open, retry: false },
  });
  const previewQuery = useAdminCreditsPreviewControllerPreview(
    { amountUsd: amount },
    { query: { enabled: open && validAmount, retry: false } },
  );
  const grantMutation = useAdminCreditsControllerGrant();

  const balance = balanceQuery.data as unknown as Balance | undefined;
  const preview = previewQuery.data as unknown as
    | { credits: number; markup: number }
    | undefined;

  const close = () => {
    setAmount("");
    setNote("");
    onClose();
  };

  const grant = async () => {
    if (!validAmount || !shop) {
      toast.error(t("admin.credits.badAmount"));
      return;
    }
    try {
      const res = (await grantMutation.mutateAsync({
        shopId: shop.id,
        data: { amountUsd: parsed, note: note.trim() || undefined },
      })) as unknown as { credits: number; balance: number };
      await queryClient.invalidateQueries();
      toast.success(
        t("admin.credits.granted", {
          credits: res.credits,
          balance: res.balance,
        }),
      );
      close();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.credits.grantFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.credits.grantTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.credits.grantSubtitle", { shop: shop?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <p className="tabular text-sm text-muted-foreground">
          {balanceQuery.isLoading
            ? t("common.loading")
            : balanceQuery.isError
              ? t("admin.credits.balanceFailed")
              : t("admin.credits.currentBalance", {
                  available: balance?.available ?? 0,
                })}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="grant-amount">{t("admin.credits.amount")}</Label>
          <Input
            id="grant-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="20"
            className="tabular"
          />
          <p className="text-xs text-muted-foreground">
            {validAmount && preview
              ? t("admin.credits.preview", {
                  credits: preview.credits,
                  markup: preview.markup,
                })
              : t("admin.credits.amountHint")}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grant-note">{t("admin.credits.note")}</Label>
          <Input
            id="grant-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("admin.credits.notePlaceholder")}
            maxLength={200}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={grantMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={grant}
            disabled={grantMutation.isPending || !validAmount}
          >
            {t(
              grantMutation.isPending
                ? "admin.credits.granting"
                : "admin.credits.grant",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
