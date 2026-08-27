"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoDropzone, type UploadedPhoto } from "./photo-dropzone";
import { PhotoAiDialog } from "@/components/shared/photo-ai-dialog";
import { FixDescriptionButton } from "@/components/shared/fix-description-button";
import { ProductAutofillButton } from "@/components/shared/product-autofill-button";
import { applyGenerated } from "@/components/shared/apply-generated";
import { CategorySelect } from "./category-select";
import { useT } from "@/components/providers/i18n-provider";
import { useSellerShop } from "@/lib/api/seller";
import { apiErrorMessage } from "@/lib/api/errors";
import { useSellerProductCardsControllerCreate } from "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller";
import { resolvePhotoKeys } from "@/lib/api/upload";
import { formatPriceInput, parsePriceInput } from "@/lib/format";
import { cleanSpecs, withBrandModel } from "@/lib/product-form";

function SectionTitle({
  index,
  children,
  action,
}: {
  index: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular">
        {index}
      </span>
      <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function brandModelSpecs(
  brand: string,
  model: string,
  specs: { name: string; value: string }[],
): { key: string; value: string }[] {
  return withBrandModel(
    brand,
    model,
    cleanSpecs(specs.map((s) => ({ key: s.name, value: s.value }))),
  );
}

export function AddProductForm({
  embedded = false,
  onDone,
}: {
  embedded?: boolean;
  onDone?: () => void;
} = {}) {
  const { t } = useT();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { shop, isLoading: shopLoading } = useSellerShop();

  const createMutation = useSellerProductCardsControllerCreate();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"new" | "old">("new");
  const [specs, setSpecs] = useState<{ name: string; value: string }[]>([
    { name: "", value: "" },
  ]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiPhoto, setAiPhoto] = useState<UploadedPhoto | null>(null);

  const onPriceChange = (raw: string) => setPrice(formatPriceInput(raw));

  const shopAbolished = Boolean(shop) && shop!.status !== "active";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) {
      toast.error(t("seller.add.needShop"));
      router.push("/seller/profile");
      return;
    }
    if (shopAbolished) {
      toast.error(t("seller.add.shopAbolished"));
      return;
    }
    const priceNum = negotiable ? null : parsePriceInput(price);
    if (!name.trim() || (!negotiable && !priceNum)) {
      toast.error(t("seller.add.needNamePrice"));
      return;
    }
    if (photos.length === 0) {
      toast.error(t("seller.add.needPhoto"));
      return;
    }
    if (!categoryId) {
      toast.error(t("seller.add.needCategory"));
      return;
    }

    setSubmitting(true);
    try {
      const keys = await resolvePhotoKeys(photos);

      const characteristics = brandModelSpecs(brand, model, specs);

      await createMutation.mutateAsync({
        shopId: shop.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          photos: keys,
          price: priceNum,
          state,
          categoryId: categoryId ?? undefined,
          characteristics: characteristics.length ? characteristics : undefined,
        },
      });

      await queryClient.invalidateQueries();
      toast.success(t("seller.add.publish"), {
        description: t("seller.add.sentToAi"),
      });
      if (onDone) onDone();
      else router.push("/seller/products");
    } catch (err) {
      toast.error(
        apiErrorMessage(err, t, "seller.add.createFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = "space-y-1.5";

  return (
    <form onSubmit={submit} className="space-y-6">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.add.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("seller.add.subtitle")}</p>
          </div>
        </div>
      )}

      {!shopLoading && !shop && (
        <Card className="border-warning/40 bg-warning/5 p-4 text-sm">
          {t("seller.shop.none")}{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => router.push("/seller/profile")}
          >
            {t("seller.shop.create")}
          </button>
        </Card>
      )}

      {shopAbolished && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            {t("seller.shop.abolishedShort")}
          </p>
          {shop?.abolishReason && (
            <p className="mt-1 text-muted-foreground">
              {t("common.reasonLine", { reason: shop.abolishReason })}
            </p>
          )}
        </Card>
      )}

      <Card className="p-6">
        <SectionTitle
          index={1}
          action={
            <ProductAutofillButton
              photos={photos}
              name={name}
              context={{
                description,
                characteristics: brandModelSpecs(brand, model, specs),
                categoryId,
                state,
              }}
              snapshot={{ description, brand, model, specs, categoryId, state }}
              onApply={(result) => {
                if (result.description) setDescription(result.description);
                if (result.brand) setBrand(result.brand);
                if (result.model) setModel(result.model);
                if (result.characteristics.length > 0) {
                  setSpecs(
                    result.characteristics.map((c) => ({
                      name: c.key,
                      value: c.value,
                    })),
                  );
                }
                if (result.categoryId) setCategoryId(result.categoryId);
                if (result.state) setState(result.state);
              }}
              onRestore={(before) => {
                setDescription(before.description);
                setBrand(before.brand);
                setModel(before.model);
                setSpecs(before.specs);
                setCategoryId(before.categoryId);
                setState(before.state);
              }}
              onPhotoStored={(photoId, key) =>
                setPhotos((prev) =>
                  prev.map((p) => (p.id === photoId ? { ...p, key } : p)),
                )
              }
              disabled={shopAbolished}
            />
          }
        >
          {t("seller.add.section1")}
        </SectionTitle>
        <div className="grid gap-5">
          <div className={field}>
            <Label htmlFor="name">{t("seller.add.name")}</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("seller.add.namePlaceholder")}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className={field}>
              <Label htmlFor="brand">{t("seller.add.brand")}</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="NVIDIA" />
            </div>
            <div className={field}>
              <Label htmlFor="model">{t("seller.add.model")}</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="RTX 4070" />
            </div>
          </div>

          <div className={field}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="desc">{t("seller.add.description")}</Label>
              <FixDescriptionButton
                photo={photos[0]}
                name={name}
                text={description}
                onResult={setDescription}
                onPhotoStored={(photoId, key) =>
                  setPhotos((prev) =>
                    prev.map((p) => (p.id === photoId ? { ...p, key } : p)),
                  )
                }
              />
            </div>
            <Textarea
              id="desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("seller.add.descriptionPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("ai.description.markdownHint")}
            </p>
          </div>

          <div className={field}>
            <Label>{t("category.label")}</Label>
            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
              allowRestricted={shop?.restrictedCategoriesEnabled ?? false}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className={field}>
              <Label htmlFor="price">{t("seller.add.price")}, {t("common.currency")}</Label>
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="419 900"
                className="tabular"
                disabled={negotiable}
              />
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-muted-foreground">
                <Checkbox
                  checked={negotiable}
                  onCheckedChange={(v) => setNegotiable(v === true)}
                />
                {t("seller.add.negotiable")}
              </label>
            </div>
            <div className={field}>
              <Label>{t("seller.add.condition")}</Label>
              <Select value={state} onValueChange={(v) => setState(v as "new" | "old")}>
                <SelectTrigger className="w-full text-base font-normal md:text-sm dark:hover:bg-input/30">
                  <SelectValue placeholder={t("seller.add.conditionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("seller.add.conditionNew")}</SelectItem>
                  <SelectItem value="old">{t("seller.add.conditionUsed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle index={2}>{t("seller.add.section2")}</SectionTitle>
        <div className="space-y-3">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                placeholder={t("seller.add.specName")}
                value={s.name}
                onChange={(e) =>
                  setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <Input
                placeholder={t("seller.add.specValue")}
                value={s.value}
                onChange={(e) =>
                  setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setSpecs((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : arr))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => setSpecs((arr) => [...arr, { name: "", value: "" }])}
        >
          <Plus className="size-4" />
          {t("seller.add.addSpec")}
        </Button>
      </Card>

      <Card className="p-6">
        <SectionTitle index={3}>{t("seller.add.section3")}</SectionTitle>
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
            const { photos: next, dropped } = applyGenerated(
              photos,
              aiPhoto?.id,
              generated,
            );
            setPhotos(next);
            if (dropped > 0) {
              toast.error(t("admin.photoAi.tooManyPhotos", { count: dropped }));
            }
          }}
          onPhotoStored={(photoId, key) =>
            setPhotos((prev) =>
              prev.map((p) => (p.id === photoId ? { ...p, key } : p)),
            )
          }
        />
      </Card>

      <div className="flex flex-wrap justify-end gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <Button
          type="submit"
          className="gap-2"
          disabled={submitting || shopAbolished}
        >
          <Send className="size-4" />
          {submitting ? t("common.loading") : t("seller.add.publish")}
        </Button>
      </div>
    </form>
  );
}
