"use client";

import { useState } from "react";
import { Flag } from "@/components/icons";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReportsControllerCreate } from "@/lib/api/generated/endpoints/reports/reports";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { LoginDialog } from "@/components/auth/login-dialog";
import { apiErrorMessageByStatus } from "@/lib/api/errors";

const CONTEXT_MAX = 2000;

export function ReportDialog({
  shopId,
  productCardId,
  children,
}: {
  shopId: number;
  productCardId?: number;
  children?: React.ReactNode;
}) {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const { mutateAsync, isPending } = useReportsControllerCreate();

  const submit = async () => {
    const value = context.trim();
    if (value.length < 5) {
      toast.error(t("report.tooShort"));
      return;
    }
    try {
      await mutateAsync({
        data: {
          context: value,
          shop_id: shopId,
          product_card_id: productCardId,
        },
      });
      toast.success(t("report.sent"));
      setContext("");
      setOpen(false);
    } catch (err) {
      // Сервер отвечает осмысленно: 409 — жалоба уже была, 403 — жалоба на свой
      // же магазин, 429 — слишком часто. Гасить это общим «не получилось»
      // значит заставлять человека жать кнопку повторно.
      toast.error(
        apiErrorMessageByStatus(
          err,
          t,
          {
            403: "report.ownShop",
            409: "report.already",
            429: "report.tooOften",
          },
          "report.failed",
        ),
      );
    }
  };

  const trigger = children ?? (
    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
      <Flag className="size-3.5" />
      {t("report.trigger")}
    </Button>
  );

  // Жалобу принимает только авторизованный: неаутентифицированному нажатию
  // подставляем вход вместо формы. До гидратации состояние входа неизвестно,
  // поэтому там тоже вход — он же и проведёт дальше, если человек уже вошёл.
  if (!isHydrated || !isAuthenticated) {
    return <LoginDialog redirectTo={null}>{trigger}</LoginDialog>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>
            {t(productCardId ? "report.onProduct" : "report.onShop")}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, CONTEXT_MAX))}
            placeholder={t("report.placeholder")}
            rows={4}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground tabular">
            {context.length} / {CONTEXT_MAX}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {t("report.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
