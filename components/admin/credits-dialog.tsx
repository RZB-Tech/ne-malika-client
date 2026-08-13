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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminCreditsControllerBalance,
  useAdminCreditsControllerGrant,
  useAdminCreditsControllerRevoke,
  useAdminCreditsPreviewControllerPreview,
} from "@/lib/api/generated/endpoints/credits-admin/credits-admin";
import { useT } from "@/components/providers/i18n-provider";

interface Balance {
  balance: number;
  reserved: number;
  available: number;
}

/**
 * Единый диалог управления кредитами магазина: выдача и отбор на двух вкладках.
 * Объединяет бывшие GrantCreditsDialog и RevokeCreditsDialog в одно место,
 * чтобы в контекстном меню была одна кнопка «Кредиты» вместо двух.
 */
export function CreditsDialog({
  shop,
  onClose,
  initialTab = "grant",
}: {
  shop: { id: number; name: string } | null;
  onClose: () => void;
  initialTab?: "grant" | "revoke";
}) {
  const { t } = useT();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"grant" | "revoke">(initialTab);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [revokeAmount, setRevokeAmount] = useState("");
  const [revokeNote, setRevokeNote] = useState("");

  const open = shop !== null;
  const shopId = shop?.id ?? 0;

  const parsedGrant = Number(grantAmount);
  const validGrant = Number.isFinite(parsedGrant) && parsedGrant >= 1;
  const parsedRevoke = Number(revokeAmount);
  const validRevoke = Number.isFinite(parsedRevoke) && parsedRevoke >= 1;

  const balanceQuery = useAdminCreditsControllerBalance(shopId, {
    query: { enabled: open, retry: false },
  });
  const previewQuery = useAdminCreditsPreviewControllerPreview(
    { amountUsd: grantAmount },
    { query: { enabled: open && validGrant, retry: false } },
  );
  const grantMutation = useAdminCreditsControllerGrant();
  const revokeMutation = useAdminCreditsControllerRevoke();

  const balance = balanceQuery.data as unknown as Balance | undefined;
  const available = balance?.available ?? 0;
  const preview = previewQuery.data as unknown as
    | { credits: number; markup: number }
    | undefined;

  const close = () => {
    setGrantAmount("");
    setGrantNote("");
    setRevokeAmount("");
    setRevokeNote("");
    setTab(initialTab);
    onClose();
  };

  const grant = async () => {
    if (!validGrant || !shop) {
      toast.error(t("admin.credits.badAmount"));
      return;
    }
    try {
      const res = (await grantMutation.mutateAsync({
        shopId: shop.id,
        data: {
          amountUsd: parsedGrant,
          note: grantNote.trim() || undefined,
        },
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

  const revoke = async () => {
    if (!validRevoke || !shop) {
      toast.error(t("admin.credits.badRevokeAmount"));
      return;
    }
    try {
      const res = (await revokeMutation.mutateAsync({
        shopId: shop.id,
        data: {
          credits: Math.floor(parsedRevoke),
          note: revokeNote.trim() || undefined,
        },
      })) as unknown as { taken: number; balance: number };
      await queryClient.invalidateQueries();
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

  const busy = grantMutation.isPending || revokeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.credits.creditsAction")}</DialogTitle>
          <DialogDescription>
            {t("admin.credits.grantSubtitle", { shop: shop?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <p className="tabular text-sm text-muted-foreground">
          {balanceQuery.isLoading
            ? t("common.loading")
            : balanceQuery.isError
              ? t("admin.credits.balanceFailed")
              : t("admin.credits.currentBalance", { available })}
        </p>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "grant" | "revoke")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="grant">
              {t("admin.credits.grantTitle")}
            </TabsTrigger>
            <TabsTrigger value="revoke">
              {t("admin.credits.revokeTitle")}
            </TabsTrigger>
          </TabsList>

          {/* ── Выдача ── */}
          <TabsContent value="grant" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="grant-amount">
                {t("admin.credits.amount")}
              </Label>
              <Input
                id="grant-amount"
                inputMode="decimal"
                value={grantAmount}
                onChange={(e) =>
                  setGrantAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="20"
                className="tabular"
              />
              <p className="text-xs text-muted-foreground">
                {validGrant && preview
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
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder={t("admin.credits.notePlaceholder")}
                maxLength={200}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={busy}>
                {t("common.cancel")}
              </Button>
              <Button onClick={grant} disabled={busy || !validGrant}>
                {t(
                  grantMutation.isPending
                    ? "admin.credits.granting"
                    : "admin.credits.grant",
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ── Отбор ── */}
          <TabsContent value="revoke" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="revoke-amount">
                {t("admin.credits.revokeAmount")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="revoke-amount"
                  inputMode="numeric"
                  value={revokeAmount}
                  onChange={(e) =>
                    setRevokeAmount(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="5000"
                  className="tabular"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRevokeAmount(String(available))}
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
                value={revokeNote}
                onChange={(e) => setRevokeNote(e.target.value)}
                placeholder={t("admin.credits.revokeNotePlaceholder")}
                maxLength={200}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={busy}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={revoke}
                disabled={busy || !validRevoke}
              >
                {t(
                  revokeMutation.isPending
                    ? "admin.credits.revoking"
                    : "admin.credits.revoke",
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
