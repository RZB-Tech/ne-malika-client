"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/providers/i18n-provider";
import { AddProductForm } from "./add-product-form";
import { onOpenAddProduct } from "./add-product-bus";

export function AddProductDialog() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenAddProduct(() => setOpen(true)), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("seller.add.title")}</DialogTitle>
          <DialogDescription>{t("seller.add.subtitle")}</DialogDescription>
        </DialogHeader>

        {open && (
          <AddProductForm
            key={String(open)}
            embedded
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
