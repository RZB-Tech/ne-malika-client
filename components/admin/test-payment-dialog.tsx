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
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber, formatTime } from "@/lib/format";
import { Copy, ExternalLink } from "@/components/icons";
import type { TestPaymentLinkDto } from "@/lib/api/generated/schemas";

/** Магазин, на котором проверяют кассу. */
export interface TestPaymentTarget {
  shopId: number;
  shopName: string;
}

/**
 * Ссылка на тестовую оплату: сумма, срок жизни окна и кнопка «Открыть кассу».
 *
 * Окном, а не тостом с адресом: ссылку нужно открыть руками и, скорее всего,
 * на телефоне — там стоит приложение Click. Тост исчезает через несколько
 * секунд, а вместе с ним и единственный способ попасть в открытое окно; второй
 * раз нажимать кнопку пришлось бы ради того же адреса.
 *
 * Отдельно и заметно сказано, что подписка не выдастся. Это не осторожность:
 * администратор, увидевший «оплата прошла» и не увидевший подписки, первым
 * делом решит, что сломана выдача, — и пойдёт искать несуществующую ошибку.
 */
export function TestPaymentDialog({
  target,
  link,
  onClose,
}: {
  target: TestPaymentTarget | null;
  link: TestPaymentLinkDto | null;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const [copied, setCopied] = useState(false);

  const open = Boolean(target && link);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success(t("admin.subscriptions.testCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /**
       * Буфер обмена закрыт (нет разрешения, страница не в защищённом
       * контексте). Молчать нельзя: администратор решит, что скопировалось,
       * и вставит в адресную строку то, что лежало там раньше.
       */
      toast.error(t("admin.subscriptions.testCopyFailed"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.subscriptions.testTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.subscriptions.testText", { shop: target?.shopName ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">
                {t("admin.subscriptions.testAmount")}
              </dt>
              <dd className="tabular font-medium">
                {t("admin.subscriptions.testSum", {
                  amount: formatNumber(link.amountUzs, locale),
                })}
              </dd>
              <dt className="text-muted-foreground">
                {t("admin.subscriptions.testArmedUntil")}
              </dt>
              <dd className="tabular font-medium">
                {formatTime(link.armedUntil, locale)}
              </dd>
            </dl>

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
              <Button variant="outline" onClick={copy} disabled={copied}>
                <Copy className="size-4" />
                {copied
                  ? t("admin.subscriptions.testCopied")
                  : t("admin.subscriptions.testCopy")}
              </Button>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
