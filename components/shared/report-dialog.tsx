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

export function ReportDialog({
  shopId,
  productCardId,
  children,
}: {
  shopId: number;
  productCardId?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const { mutateAsync, isPending } = useReportsControllerCreate();

  const submit = async () => {
    const value = context.trim();
    if (value.length < 5) {
      toast.error("Опишите проблему подробнее (минимум 5 символов)");
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
      toast.success("Жалоба отправлена. Спасибо!");
      setContext("");
      setOpen(false);
    } catch {
      toast.error("Не удалось отправить жалобу");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Flag className="size-3.5" />
            Пожаловаться
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пожаловаться</DialogTitle>
          <DialogDescription>
            Опишите, что не так с {productCardId ? "товаром" : "магазином"}. Жалобу
            рассмотрит администратор.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Например: продавец не отвечает, товар не соответствует фото…"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={isPending}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
