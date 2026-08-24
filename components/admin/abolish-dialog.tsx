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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/providers/i18n-provider";

/** Reason-required confirmation used for admin "упразднить" actions. */
export function AbolishDialog({
  title,
  description,
  onConfirm,
  children,
}: {
  title: string;
  description?: string;
  onConfirm: (reason: string) => void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (reason.trim().length < 5) {
      toast.error(t("admin.common.reasonTooShort"));
      return;
    }
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={t("admin.common.reasonPlaceholder")}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {t("admin.common.abolish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
