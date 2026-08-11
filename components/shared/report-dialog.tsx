"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
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
    } catch {
      toast.error(t("report.failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Flag className="size-3.5" />
            {t("report.trigger")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>
            {t(productCardId ? "report.onProduct" : "report.onShop")}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t("report.placeholder")}
          rows={4}
        />
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
