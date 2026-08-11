"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

/**
 * Подтверждение необратимого действия. Вместо window.confirm: тот выглядит
 * системным окном браузера, не подчиняется теме и на телефоне выглядит чужеродно.
 *
 * Для действий, где нужна ещё и причина, есть AbolishDialog.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  children,
}: {
  title: string;
  description?: string;
  /** По умолчанию — «Подтвердить» на языке интерфейса. */
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const confirm = async (e: React.MouseEvent) => {
    // Закрываем сами, когда действие отработало: иначе окно исчезает раньше,
    // чем запрос ушёл, и об ошибке сообщить уже негде.
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={confirm}
            className={cn(
              destructive &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {busy ? t("common.running") : (confirmLabel ?? t("common.confirm"))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
