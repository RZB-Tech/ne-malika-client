"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/shared/product-image";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ModerationBadge } from "@/components/shared/badges";
import { ProductStatsCard } from "@/components/seller/product-stats";
import {
  PhotoDropzone,
  storedPhoto,
  type UploadedPhoto,
} from "@/components/seller/photo-dropzone";
import { useT } from "@/components/providers/i18n-provider";
import {
  useSellerAiChecksControllerGetCheck,
  useSellerAiChecksControllerRecheck,
  useSellerProductCardsControllerRemove,
  useSellerProductCardsControllerUpdate,
} from "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller";
import { useSellerProducts } from "@/lib/api/seller";
import { mapProductRow } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { resolvePhotoKeys } from "@/lib/api/upload";
import { formatPriceInput, parsePriceInput } from "@/lib/format";
import type { AiProductCheck } from "@/lib/api/types";

type Spec = { key: string; value: string };

export function SellerProductDetail({ id }: { id: number }) {
  const { t } = useT();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { shop, rows, isLoading } = useSellerProducts();
  const row = rows.find((p) => p.id === id);

  const aiCheckQuery = useSellerAiChecksControllerGetCheck(id, {
    query: { select: (raw) => raw as unknown as AiProductCheck, retry: false },
  });

  const updateMutation = useSellerProductCardsControllerUpdate();
  const removeMutation = useSellerProductCardsControllerRemove();
  const recheckMutation = useSellerAiChecksControllerRecheck();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"new" | "old">("new");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [hydratedRowId, setHydratedRowId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Заполняем форму один раз, когда товар загрузился. Приведение состояния
  // во время рендера — рекомендованная React альтернатива setState в эффекте.
  if (row && row.id !== hydratedRowId) {
    setHydratedRowId(row.id);
    setName(row.name);
    setPrice(formatPriceInput(Number(row.price)));
    setDescription(row.description ?? "");
    setState(row.state);
    setSpecs(row.characteristics ?? []);
    setPhotos(
      (row.photos ?? []).map((key) => storedPhoto(key, photoUrl(key) ?? "", row.name)),
    );
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (!row) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Товар не найден.{" "}
        <Link href="/seller/products" className="text-primary hover:underline">
          К списку
        </Link>
      </div>
    );
  }

  const product = mapProductRow(row, shop?.name);

  const save = async () => {
    const priceNum = parsePriceInput(price);
    if (name.trim().length < 2 || !priceNum) {
      toast.error("Проверьте название и цену");
      return;
    }
    if (photos.length === 0) {
      toast.error("Добавьте хотя бы одно фото");
      return;
    }
    setSaving(true);
    try {
      const photoKeys = await resolvePhotoKeys(photos);

      await updateMutation.mutateAsync({
        id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          photos: photoKeys,
          price: priceNum,
          state,
          characteristics: specs
            .filter((s) => s.key.trim() && s.value.trim())
            .map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
        },
      });
      await queryClient.invalidateQueries();
      // Сбрасываем метку — форма перезаполнится с сервера, и свежезагруженные
      // фото начнут показываться по ключу, а не как локальный data:-URL.
      setHydratedRowId(null);
      toast.success("Изменения сохранены — товар отправлен на ИИ-проверку");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const recheck = async () => {
    try {
      await recheckMutation.mutateAsync({ id });
      await queryClient.invalidateQueries();
      toast.success("Товар отправлен на проверку — результат появится здесь");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось отправить на проверку",
      );
    }
  };

  const remove = async () => {
    try {
      await removeMutation.mutateAsync({ id });
      await queryClient.invalidateQueries();
      toast.success(t("common.delete"));
      router.push("/seller/products");
    } catch {
      toast.error("Не удалось удалить товар");
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground">
        <Link href="/seller/products">
          <ArrowLeft className="size-4" />
          {t("seller.products.backToList")}
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <ProductImage
            hue={product.hue}
            categorySlug={product.categorySlug}
            // Превью берём из редактируемого списка, а не из строки с сервера,
            // чтобы главное фото менялось сразу при правке галереи.
            src={photos[0]?.url ?? null}
            alt={product.name}
            // self-start: без него flex растягивает блок по высоте формы.
            // natural: высоту задаёт само фото — ни обрезки, ни полей сверху и снизу.
            fit="natural"
            className="w-full shrink-0 self-start rounded-xl sm:w-80 lg:w-[26rem]"
            iconClassName="size-14"
          />
          {/* max-w: на широком экране поля иначе растягиваются на всю карточку и выглядят пустыми. */}
          <div className="min-w-0 flex-1 space-y-4 lg:max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <ModerationBadge status={product.moderation} />
              {row.abolishReason && (
                <span className="text-xs text-destructive">{row.abolishReason}</span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pname">{t("seller.add.name")}</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pprice">{t("seller.add.price")}, {t("common.currency")}</Label>
                <Input
                  id="pprice"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(formatPriceInput(e.target.value))}
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("seller.add.condition")}</Label>
                <Select value={state} onValueChange={(v) => setState(v as "new" | "old")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t("seller.add.conditionNew")}</SelectItem>
                    <SelectItem value="old">{t("seller.add.conditionUsed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pdesc">{t("seller.add.description")}</Label>
                <Textarea id="pdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? t("common.loading") : t("common.save")}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/product/${product.id}`}>
                  <Send className="size-4" />
                  {t("seller.products.viewOnSite")}
                </Link>
              </Button>
              <ConfirmDialog
                title={t("common.delete")}
                description={t("seller.products.deleteConfirm")}
                confirmLabel={t("common.delete")}
                destructive
                onConfirm={remove}
              >
                <Button variant="outline" className="ml-auto gap-2 text-destructive">
                  <Trash2 className="size-4" />
                  {t("common.delete")}
                </Button>
              </ConfirmDialog>
            </div>
          </div>
        </div>
      </Card>

      {shop && <ProductStatsCard productId={id} shopId={shop.id} />}

      {/* characteristics editor */}
      <Card className="p-6">
        <h2 className="mb-4 font-heading text-lg font-bold tracking-tight">{t("seller.add.section2")}</h2>
        <div className="space-y-3">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                placeholder={t("seller.add.specName")}
                value={s.key}
                onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
              />
              <Input
                placeholder={t("seller.add.specValue")}
                value={s.value}
                onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))}
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
          onClick={() => setSpecs((arr) => [...arr, { key: "", value: "" }])}
        >
          <Plus className="size-4" />
          {t("seller.add.addSpec")}
        </Button>
      </Card>

      {/* AI check */}
      <AiCheckPanel
        check={aiCheckQuery.data}
        loading={aiCheckQuery.isLoading}
        onRecheck={recheck}
        recheckDisabled={recheckMutation.isPending || row.status === "abolished"}
      />

      {/* photos editor */}
      <Card className="p-6">
        <h2 className="mb-4 font-heading text-lg font-bold tracking-tight">{t("seller.add.section3")}</h2>
        <PhotoDropzone photos={photos} onChange={setPhotos} />
      </Card>

    </div>
  );
}

const VERDICT_UI = {
  pass: { Icon: CheckCircle2, cls: "text-success", label: "Проверка пройдена" },
  warn: { Icon: TriangleAlert, cls: "text-warning", label: "Есть замечания" },
  fail: { Icon: XCircle, cls: "text-destructive", label: "Не пройдена" },
} as const;

const ASPECT_LABELS: Record<string, string> = {
  description: "Описание",
  dataConsistency: "Согласованность данных",
  photos: "Фотографии",
  photoMatch: "Фото и описание",
};

function AiCheckPanel({
  check,
  loading,
  onRecheck,
  recheckDisabled,
}: {
  check: AiProductCheck | undefined;
  loading: boolean;
  onRecheck: () => void;
  recheckDisabled: boolean;
}) {
  const ui = check?.verdict ? VERDICT_UI[check.verdict] : null;

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-bold tracking-tight">
          ИИ-проверка
        </h2>
        {!loading && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-2"
            onClick={onRecheck}
            disabled={recheckDisabled}
          >
            <RefreshCw className="size-4" />
            Проверить заново
          </Button>
        )}
      </div>

      {/* Технический текст ошибки продавцу не поможет — он не в его власти. */}
      {check?.error && (
        <p className="mb-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          Проверка не завершилась из-за сбоя на нашей стороне. Товар опубликован,
          но проверен не был — нажмите «Проверить заново».
        </p>
      )}

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : !ui ? (
        <p className="text-sm text-muted-foreground">
          {check?.message ?? "Проверка ещё не выполнялась."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 font-medium ${ui.cls}`}>
            <ui.Icon className="size-5" />
            {ui.label}
          </div>
          {check?.summary && (
            <p className="text-sm text-muted-foreground">{check.summary}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(check?.checks ?? {}).map(([key, detail]) => {
              if (!detail) return null;
              const aspect = VERDICT_UI[detail.verdict];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div
                    className={`flex items-center gap-1.5 font-medium ${aspect.cls}`}
                  >
                    <aspect.Icon className="size-4" />
                    {ASPECT_LABELS[key] ?? key}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {detail.notes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
