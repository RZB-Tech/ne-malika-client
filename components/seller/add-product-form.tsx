"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { GOALS, reachGoal } from "@/lib/metrika";

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
  const [specs, setSpecs] = useState<{ name: string; value: string }[]>([{ name: "", value: "" }]);
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

      reachGoal(GOALS.productCreated, { shopId: shop.id, categoryId });

      await queryClient.invalidateQueries();
      toast.success(t("seller.add.publish"), {
        description: t("seller.add.sentToAi"),
      });
      if (onDone) onDone();
      else router.push("/seller/products");
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "seller.add.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const Footer = embedded ? DialogFooter : "div";

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-5">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t("seller.add.title")}
            </h1>
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
          <p className="font-medium text-destructive">{t("seller.shop.abolishedShort")}</p>
          {shop?.abolishReason && (
            <p className="mt-1 text-muted-foreground">
              {t("common.reasonLine", { reason: shop.abolishReason })}
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
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
            setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, key } : p)))
          }
          disabled={shopAbolished}
        />
      </div>

      <FieldGroup className="min-w-0">
        <Field>
          <FieldLabel htmlFor="name">{t("seller.add.name")}</FieldLabel>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("seller.add.namePlaceholder")}
          />
        </Field>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field className="min-w-0">
            <FieldLabel htmlFor="price">
              {t("seller.add.price")}, {t("common.currency")}
            </FieldLabel>
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
            <Field orientation="horizontal">
              <Checkbox
                id="negotiable"
                checked={negotiable}
                onCheckedChange={(v) => setNegotiable(v === true)}
              />
              <FieldLabel htmlFor="negotiable">{t("seller.add.negotiable")}</FieldLabel>
            </Field>
          </Field>
          <Field className="min-w-0">
            <FieldLabel htmlFor="condition">{t("seller.add.condition")}</FieldLabel>
            <Select value={state} onValueChange={(v) => setState(v as "new" | "old")}>
              <SelectTrigger id="condition" className="w-full">
                <SelectValue placeholder={t("seller.add.conditionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="new">{t("seller.add.conditionNew")}</SelectItem>
                  <SelectItem value="old">{t("seller.add.conditionUsed")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel>{t("category.label")}</FieldLabel>
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
            allowRestricted={shop?.restrictedCategoriesEnabled ?? false}
          />
        </Field>

        <Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel htmlFor="desc">{t("seller.add.description")}</FieldLabel>
            <FixDescriptionButton
              photo={photos[0]}
              name={name}
              text={description}
              onResult={setDescription}
              onPhotoStored={(photoId, key) =>
                setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, key } : p)))
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
          <p className="text-xs text-muted-foreground">{t("ai.description.markdownHint")}</p>
        </Field>

        <FieldGroup aria-labelledby="characteristics-label" className="gap-2">
          <FieldLabel id="characteristics-label">{t("seller.add.section2")}</FieldLabel>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="min-w-0">
              <FieldLabel htmlFor="brand">{t("seller.add.brand")}</FieldLabel>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="NVIDIA"
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="model">{t("seller.add.model")}</FieldLabel>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="RTX 4070"
              />
            </Field>
          </FieldGroup>
          <FieldGroup className="gap-3">
            {specs.map((s, i) => (
              <FieldGroup
                key={i}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
              >
                <Input
                  aria-label={t("seller.add.specName")}
                  placeholder={t("seller.add.specName")}
                  value={s.name}
                  onChange={(e) =>
                    setSpecs((arr) =>
                      arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  aria-label={t("seller.add.specValue")}
                  placeholder={t("seller.add.specValue")}
                  value={s.value}
                  onChange={(e) =>
                    setSpecs((arr) =>
                      arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("common.delete")}
                  className="shrink-0"
                  onClick={() =>
                    setSpecs((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : arr))
                  }
                >
                  <Trash2 />
                </Button>
              </FieldGroup>
            ))}
          </FieldGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setSpecs((arr) => [...arr, { name: "", value: "" }])}
          >
            <Plus data-icon="inline-start" />
            {t("seller.add.addSpec")}
          </Button>
        </FieldGroup>

        <Field aria-labelledby="photos-label">
          <FieldLabel id="photos-label">{t("seller.add.section3")}</FieldLabel>
          <PhotoDropzone photos={photos} onChange={setPhotos} onPhotoClick={setAiPhoto} />
          <p className="text-xs text-muted-foreground">{t("admin.form.photoHint")}</p>
        </Field>
      </FieldGroup>

      <PhotoAiDialog
        photo={aiPhoto}
        onClose={() => setAiPhoto(null)}
        onApply={(generated) => {
          const { photos: next, dropped } = applyGenerated(photos, aiPhoto?.id, generated);
          setPhotos(next);
          if (dropped > 0) {
            toast.error(t("admin.photoAi.tooManyPhotos", { count: dropped }));
          }
        }}
        onPhotoStored={(photoId, key) =>
          setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, key } : p)))
        }
      />

      <Footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {embedded && onDone && (
          <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={submitting || shopAbolished}>
          <Send data-icon="inline-start" />
          {submitting ? t("common.loading") : t("seller.add.publish")}
        </Button>
      </Footer>
    </form>
  );
}
