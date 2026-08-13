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
  useAdminCreditsControllerRevoke,
} from "@/lib/api/generated/endpoints/credits-admin/credits-admin";
import { useT } from "@/components/providers/i18n-provider";

interface Balance {
  balance: number;
  reserved: number;
  available: number;
}

/**
 * Отбор кредитов у магазина: ошибочное начисление, возврат оплаты, санкция.
 *
 * В кредитах, а не в долларах, в отличие от выдачи: администратор смотрит на
 * остаток магазина и решает, сколько от него оставить, — переводить это в
 * доллары в уме незачем. Кнопка «всё доступное» рядом ровно поэтому же.
 */
export function RevokeCreditsDialog({
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
  const revokeMutation = useAdminCreditsControllerRevoke();

  const balance = balanceQuery.data as unknown as Balance | undefined;
  const available = balance?.available ?? 0;

  const close = () => {
    setAmount("");
    setNote("");
    onClose();
  };

  const revoke = async () => {
    if (!validAmount || !shop) {
      toast.error(t("admin.credits.badRevokeAmount"));
      return;
    }
    try {
      const res = (await revokeMutation.mutateAsync({
        shopId: shop.id,
        data: { credits: Math.floor(parsed), note: note.trim() || undefined },
      })) as unknown as { taken: number; balance: number };
      await queryClient.invalidateQueries();

      /**
       * Сервер снимает не больше доступного, поэтому говорим о снятом, а не о
       * запрошенном: иначе администратор считал бы, что забрал всё.
       */
      toast.success(
        t("admin.credits.revoked", {
          credits: res.taken,
          balance: res.balance,
        }),
      );
      close();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.credits.revokeFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.credits.revokeTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.credits.revokeSubtitle", { shop: shop?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <p className="tabular text-sm text-muted-foreground">
          {balanceQuery.isLoading
            ? t("common.loading")
            : balanceQuery.isError
              ? t("admin.credits.balanceFailed")
              : t("admin.credits.currentBalance", { available })}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="revoke-amount">{t("admin.credits.revokeAmount")}</Label>
          <div className="flex gap-2">
            <Input
              id="revoke-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="5000"
              className="tabular"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setAmount(String(available))}
              disabled={available === 0}
            >
              {t("admin.credits.revokeAll")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("admin.credits.revokeHint")}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="revoke-note">{t("admin.credits.note")}</Label>
          <Input
            id="revoke-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("admin.credits.revokeNotePlaceholder")}
            maxLength={200}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={close}
            disabled={revokeMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={revoke}
            disabled={revokeMutation.isPending || !validAmount}
          >
            {t(
              revokeMutation.isPending
                ? "admin.credits.revoking"
                : "admin.credits.revoke",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
