"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
import { PhotoDropzone, type UploadedPhoto } from "./photo-dropzone";
import { PhotoAiDialog } from "@/components/shared/photo-ai-dialog";
import { CategorySelect } from "./category-select";
import { useT } from "@/components/providers/i18n-provider";
import { useSellerShop } from "@/lib/api/seller";
import { useSellerProductCardsControllerCreate } from "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller";
import { resolvePhotoKeys } from "@/lib/api/upload";
import { formatPriceInput, parsePriceInput } from "@/lib/format";

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular">
        {index}
      </span>
      <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>
    </div>
  );
}

/**
 * Форма нового товара. Живёт и отдельной страницей, и внутри диалога, поэтому
 * заголовок с переходом после сохранения вынесены в параметры: в диалоге
 * заголовок свой, а уходить со страницы не нужно — достаточно закрыться.
 */
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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Фото, по которому продавец открыл генерацию через ИИ.
  const [aiPhoto, setAiPhoto] = useState<UploadedPhoto | null>(null);

  const onPriceChange = (raw: string) => setPrice(formatPriceInput(raw));

  // Упразднённый магазин скрыт из выдачи, и бэкенд отклоняет создание товара —
  // не даём заполнить длинную форму впустую.
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
    const priceNum = parsePriceInput(price);
    if (!name.trim() || !priceNum) {
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

      // Ключи характеристик ложатся в базу и показываются всем покупателям,
      // поэтому они не переводятся: иначе у одного товара было бы «Бренд», а у
      // соседнего — «Brend», в зависимости от языка продавца в момент создания.
      const characteristics = [
        ...(brand.trim() ? [{ key: "Бренд", value: brand.trim() }] : []),
        ...(model.trim() ? [{ key: "Модель", value: model.trim() }] : []),
        ...specs
          .filter((s) => s.name.trim() && s.value.trim())
          .map((s) => ({ key: s.name.trim(), value: s.value.trim() })),
      ];

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
      // Из диалога уводить некуда — он просто закрывается, а список под ним
      // уже обновлён сбросом кэша выше.
      if (onDone) onDone();
      else router.push("/seller/products");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("seller.add.createFailed"),
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

      {/* Section 1 */}
      <Card className="p-6">
        <SectionTitle index={1}>{t("seller.add.section1")}</SectionTitle>
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
            <Label htmlFor="desc">{t("seller.add.description")}</Label>
            <Textarea
              id="desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("seller.add.descriptionPlaceholder")}
            />
          </div>

          <div className={field}>
            <Label>{t("category.label")}</Label>
            <CategorySelect value={categoryId} onChange={setCategoryId} />
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
              />
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

      {/* Section 2: specs */}
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

      {/* Section 3: photos */}
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
