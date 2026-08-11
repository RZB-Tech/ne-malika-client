"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PhotoDropzone,
  storedPhoto,
  type UploadedPhoto,
} from "@/components/seller/photo-dropzone";
import { ShopPicker } from "@/components/admin/shop-picker";
import {
  useAdminProductCardsControllerCreate,
  useAdminProductCardsControllerUpdate,
} from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { CategorySelect } from "@/components/seller/category-select";
import { PhotoAiDialog } from "@/components/admin/photo-ai-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { resolvePhotoKeys } from "@/lib/api/upload";
import { photoUrl } from "@/lib/api/photo";
import { formatPriceInput, parsePriceInput } from "@/lib/format";
import type { AdminProductRow, AdminShopRow } from "@/lib/api/types";

export interface ProductFormTarget {
  /** Товар для правки; при создании — null, и тогда нужен магазин. */
  product: AdminProductRow | null;
  shopId?: number;
}

/**
 * Создание и правка товара администратором. Одна форма на оба случая:
 * поля совпадают, отличается только адрес запроса и выбор магазина.
 */
export function ProductFormDialog({
  target,
  shops,
  onOpenChange,
}: {
  target: ProductFormTarget | null;
  shops: AdminShopRow[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {target && (
          // key сбрасывает состояние формы при смене товара: иначе в неё
          // затекали бы поля предыдущего.
          <FormBody
            key={target.product?.id ?? "new"}
            target={target}
            shops={shops}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormBody({
  target,
  shops,
  onDone,
}: {
  target: ProductFormTarget;
  shops: AdminShopRow[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const editing = target.product;

  const createMutation = useAdminProductCardsControllerCreate();
  const updateMutation = useAdminProductCardsControllerUpdate();

  // Упразднённый магазин товаров не принимает — бэкенд вернёт 403, поэтому и
  // в списке его быть не должно.
  const activeShops = useMemo(
    () => shops.filter((s) => s.status === "active"),
    [shops],
  );

  const { t } = useT();
  const [shopId, setShopId] = useState<number | null>(
    editing?.shopId ?? target.shopId ?? activeShops[0]?.id ?? null,
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [price, setPrice] = useState(
    editing ? formatPriceInput(Number(editing.price)) : "",
  );
  const [state, setState] = useState<"new" | "old">(editing?.state ?? "new");
  const [categoryId, setCategoryId] = useState<number | null>(
    editing?.categoryId ?? null,
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [specs, setSpecs] = useState(editing?.characteristics ?? []);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    (editing?.photos ?? []).map((key) =>
      storedPhoto(key, photoUrl(key) ?? "", editing?.name ?? ""),
    ),
  );
  const [saving, setSaving] = useState(false);
  // Фото, которое админ нажал для перерисовки через ИИ.
  const [aiPhoto, setAiPhoto] = useState<UploadedPhoto | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parsePriceInput(price);
    if (name.trim().length < 2 || !priceNum) {
      toast.error(t("admin.form.checkNamePrice"));
      return;
    }
    if (photos.length === 0) {
      toast.error(t("admin.form.needPhoto"));
      return;
    }
    if (!editing && !shopId) {
      toast.error(t("admin.form.needShop"));
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        photos: await resolvePhotoKeys(photos),
        price: priceNum,
        state,
        categoryId: categoryId ?? undefined,
        characteristics: specs.filter((s) => s.key.trim() && s.value.trim()),
      };

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync({ shopId: shopId!, data });
      }

      await queryClient.invalidateQueries();
      toast.success(t(editing ? "admin.form.updated" : "admin.form.created"));
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.form.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>
          {t(editing ? "admin.form.editTitle" : "admin.form.newTitle")}
        </DialogTitle>
        <DialogDescription>
          {t(editing ? "admin.form.editHint" : "admin.form.newHint")}
        </DialogDescription>
      </DialogHeader>

      {!editing && (
        <div className="flex flex-col gap-1.5">
          <Label>{t("admin.form.shop")}</Label>
          <ShopPicker
            shops={activeShops}
            value={shopId}
            onChange={setShopId}
            emptyHint={t("admin.form.noActiveShops")}
          />
          {activeShops.length === 0 && (
            <p className="text-xs text-destructive">
              {t("admin.form.allShopsAbolished")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pname">{t("admin.form.name")}</Label>
        <Input
          id="pname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pprice">{t("admin.form.price")}</Label>
          <Input
            id="pprice"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(formatPriceInput(e.target.value))}
            className="tabular"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("product.state")}</Label>
          <Select
            value={state}
            onValueChange={(v) => setState(v as "new" | "old")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t("product.stateNew")}</SelectItem>
              <SelectItem value="old">{t("product.stateOld")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("category.label")}</Label>
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pdesc">{t("admin.form.description")}</Label>
        <Textarea
          id="pdesc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("admin.form.specs")}</Label>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={t("admin.form.specName")}
              value={s.key}
              onChange={(e) =>
                setSpecs((arr) =>
                  arr.map((x, j) =>
                    j === i ? { ...x, key: e.target.value } : x,
                  ),
                )
              }
            />
            <Input
              placeholder={t("admin.form.specValue")}
              value={s.value}
              onChange={(e) =>
                setSpecs((arr) =>
                  arr.map((x, j) =>
                    j === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSpecs((arr) => [...arr, { key: "", value: "" }])}
        >
          {t("admin.form.addSpec")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("admin.form.photos")}</Label>
        <PhotoDropzone
          photos={photos}
          onChange={setPhotos}
          onPhotoClick={setAiPhoto}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("admin.form.photoHint")}
        </p>

        <PhotoAiDialog
          photo={aiPhoto}
          onClose={() => setAiPhoto(null)}
          onApply={(generated) => {
            // Первый выбранный встаёт на место исходного, остальные — в конец.
            setPhotos((prev) => {
              const at = prev.findIndex((x) => x.id === aiPhoto?.id);
              if (at === -1) return [...prev, ...generated];
              const next = [...prev];
              next.splice(at, 1, generated[0]);
              return [...next, ...generated.slice(1)];
            });
          }}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
