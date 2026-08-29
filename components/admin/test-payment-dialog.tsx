"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import { formatNumber, formatTime } from "@/lib/format";
import { Copy, ExternalLink, Loader2 } from "@/components/icons";
import { useAdminShopSubscriptionControllerTestCheckout } from "@/lib/api/generated/endpoints/subscriptions-admin/subscriptions-admin";
import type { CreateTestPaymentDtoProvider, TestPaymentLinkDto } from "@/lib/api/generated/schemas";

export interface TestPaymentTarget {
  shopId: number;
  shopName: string;
}

const PROVIDERS: CreateTestPaymentDtoProvider[] = ["click", "payme"];

/**
 * Запрос, который вбивают в песочницу Payme. Дальше по протоколу меняется
 * только метод: account и сумма остаются теми же.
 */
function sandboxRequest(link: TestPaymentLinkDto): string {
  return JSON.stringify(
    {
      method: "CheckPerformTransaction",
      params: {
        amount: link.amountTiyin,
        account: { [link.accountField]: String(link.orderId) },
      },
    },
    null,
    2,
  );
}

export function TestPaymentDialog({
  target,
  onClose,
}: {
  target: TestPaymentTarget | null;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const [provider, setProvider] = useState<CreateTestPaymentDtoProvider>("payme");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<TestPaymentLinkDto | null>(null);

  const mutation = useAdminShopSubscriptionControllerTestCheckout();

  // Сбрасываем прошлый счёт на закрытии: иначе он мелькнёт при открытии
  // диалога по другому магазину.
  const close = () => {
    setLink(null);
    setAmount("");
    onClose();
  };

  const create = async () => {
    if (!target) return;

    const trimmed = amount.trim();
    const amountUzs = trimmed ? Number(trimmed) : undefined;
    if (trimmed && (!Number.isInteger(amountUzs) || (amountUzs ?? 0) <= 0)) {
      toast.error(t("admin.subscriptions.testAmountInvalid"));
      return;
    }

    try {
      const created = await mutation.mutateAsync({
        shopId: target.shopId,
        data: { provider, amountUzs },
      });
      setLink(created as TestPaymentLinkDto);
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "admin.subscriptions.testFailed"));
    }
  };

  const copy = async (value: string, successKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t(successKey));
    } catch {
      toast.error(t("admin.subscriptions.testCopyFailed"));
    }
  };

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.subscriptions.testTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.subscriptions.testText", { shop: target?.shopName ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("admin.subscriptions.testProvider")}</dt>
              <dd className="font-medium uppercase">{link.provider}</dd>

              <dt className="text-muted-foreground">{t("admin.subscriptions.testOrderId")}</dt>
              <dd className="flex items-center gap-2">
                <span className="tabular font-medium">{link.orderId}</span>
                <CopyButton
                  onClick={() =>
                    void copy(String(link.orderId), "admin.subscriptions.testCopiedValue")
                  }
                />
              </dd>

              <dt className="text-muted-foreground">{t("admin.subscriptions.testAmount")}</dt>
              <dd className="tabular font-medium">
                {t("admin.subscriptions.testSum", {
                  amount: formatNumber(link.amountUzs, locale),
                })}
              </dd>

              <dt className="text-muted-foreground">{t("admin.subscriptions.testTiyin")}</dt>
              <dd className="flex items-center gap-2">
                <span className="tabular font-medium">{link.amountTiyin}</span>
                <CopyButton
                  onClick={() =>
                    void copy(String(link.amountTiyin), "admin.subscriptions.testCopiedValue")
                  }
                />
              </dd>

              {link.provider === "payme" && (
                <>
                  <dt className="text-muted-foreground">
                    {t("admin.subscriptions.testAccountField")}
                  </dt>
                  <dd className="font-medium">{link.accountField}</dd>
                </>
              )}

              {link.merchantId && (
                <>
                  <dt className="text-muted-foreground">
                    {t("admin.subscriptions.testMerchantId")}
                  </dt>
                  <dd className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-xs">{link.merchantId}</span>
                    <CopyButton
                      onClick={() =>
                        void copy(link.merchantId ?? "", "admin.subscriptions.testCopiedValue")
                      }
                    />
                  </dd>
                </>
              )}

              <dt className="text-muted-foreground">{t("admin.subscriptions.testArmedUntil")}</dt>
              <dd className="tabular font-medium">{formatTime(link.armedUntil, locale)}</dd>
            </dl>

            {link.provider === "payme" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.subscriptions.testSandbox")}
                  </Label>
                  <CopyButton
                    onClick={() =>
                      void copy(sandboxRequest(link), "admin.subscriptions.testCopiedRequest")
                    }
                  />
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
                  {sandboxRequest(link)}
                </pre>
              </div>
            )}

            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
              {t("admin.subscriptions.testWarn")}
            </p>

            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  {t("admin.subscriptions.testOpen")}
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => void copy(link.url, "admin.subscriptions.testCopied")}
              >
                <Copy className="size-4" />
                {t("admin.subscriptions.testCopy")}
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setLink(null)}>
              {t("admin.subscriptions.testAgain")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-provider">{t("admin.subscriptions.testProvider")}</Label>
              <Select
                value={provider}
                onValueChange={(next) => setProvider(next as CreateTestPaymentDtoProvider)}
              >
                <SelectTrigger id="test-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-amount">{t("admin.subscriptions.testAmountLabel")}</Label>
              <Input
                id="test-amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={t("admin.subscriptions.testAmountPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {amount.trim()
                  ? t("admin.subscriptions.testTiyinHint", {
                      tiyin: Number(amount) * 100,
                    })
                  : t("admin.subscriptions.testAmountHint")}
              </p>
            </div>

            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
              {t("admin.subscriptions.testWarn")}
            </p>

            <Button className="w-full" disabled={mutation.isPending} onClick={() => void create()}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending
                ? t("admin.subscriptions.testCreating")
                : t("admin.subscriptions.testCreate")}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  const { t } = useT();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground"
      aria-label={t("admin.subscriptions.testCopy")}
      onClick={onClick}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}
