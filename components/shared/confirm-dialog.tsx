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
import { useT } from "@/components/providers/i18n-provider";

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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async (e: React.MouseEvent) => {
    // Диалог управляемый, а закрытие по умолчанию отменяется: иначе окно
    // исчезает раньше, чем запрос ушёл, и об ошибке сообщить уже негде.
    // Раньше на этом всё и заканчивалось — preventDefault гасил встроенное
    // закрытие Radix, а своего не было, и окно висело после успеха.
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Оставляем открытым: пользователь видит тост с ошибкой и может повторить.
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
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
          {/* variant, а не классы: Slot склеивает className простым join, без
              tailwind-merge, и bg-primary от варианта по умолчанию побеждал
              подмешанный bg-destructive — кнопка удаления выглядела обычной. */}
          <AlertDialogAction
            disabled={busy}
            onClick={confirm}
            variant={destructive ? "destructive" : "default"}
          >
            {busy ? t("common.running") : (confirmLabel ?? t("common.confirm"))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
