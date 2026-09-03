"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, RefreshCw, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import type { BannerLocale } from "@/lib/api/banners";
import type { GeneratedBannerDto } from "@/lib/api/generated/schemas";
import {
  adminBannerAiControllerGenerateRu,
  adminBannerAiControllerGenerateUz,
  useAdminBannerAiControllerPrice,
} from "@/lib/api/generated/endpoints/banners-admin/banners-admin";
import {
  sellerBannerAiControllerGenerateRu,
  sellerBannerAiControllerGenerateUz,
  useSellerBannerAiControllerPrice,
} from "@/lib/api/generated/endpoints/banners-seller/banners-seller";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { useSellerProducts } from "@/lib/api/seller";
import { photoUrl } from "@/lib/api/photo";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Рисование баннера моделью — два шага, а не один.
 *
 * Сначала русская версия: её видно целиком, и человек либо перерисовывает, либо
 * принимает. Только принятая картинка уходит на второй шаг, где та же вёрстка
 * получает узбекские надписи. Одной кнопкой «сделай оба» это не собрать: пока
 * никто не сказал «нравится», переводить нечего, а два независимых рисунка
 * разъехались бы по вёрстке и товарам.
 *
 * Вводить ничего не нужно: модель сама разбирает магазин и придумывает, что
 * нарисовать и как назвать баннер, а ссылка ведёт на страницу магазина.
 * Можно выбрать от 2 до 6 товаров магазина или оставить автовыбор.
 *
 * Кнопка перевода включается, только когда в русском слоте лежит ровно та
 * картинка, которую мы нарисовали: заменили её своим файлом — переводить нечего.
 */
export function BannerAiPanel({
  shopId,
  currentRuKey,
  onGenerated,
  disabled,
}: {
  /**
   * Магазин, которому рисуем. Задан — работаем от лица администратора: он
   * выбирает магазин сам и не платит кредитами. Пусто — продавец рисует
   * своему магазину за свой счёт.
   */
  shopId?: number | null;
  currentRuKey: string | undefined;
  onGenerated: (locale: BannerLocale, result: GeneratedBannerDto) => void;
  disabled?: boolean;
}) {
  const { t } = useT();

  const [busy, setBusy] = useState<BannerLocale | null>(null);
  const [generatedRuKey, setGeneratedRuKey] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const asAdmin = shopId !== undefined;

  const adminProductsQuery = useProductCardsControllerFindAll(
    { shop_id: shopId ?? undefined, limit: 50 },
    {
      query: {
        enabled: Boolean(asAdmin && shopId),
        select: (raw) => raw as unknown as Paginated<PublicProductCard>,
      },
    },
  );

  const sellerProductsQuery = useSellerProducts();

  const availableProducts = useMemo(() => {
    if (asAdmin) {
      return (adminProductsQuery.data?.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photos?.[0],
      }));
    }
    return (sellerProductsQuery.rows ?? []).map((p) => ({
      id: Number(p.id),
      name: p.name,
      photo: p.photos?.[0],
    }));
  }, [asAdmin, adminProductsQuery.data, sellerProductsQuery.rows]);

  const [prevShopId, setPrevShopId] = useState(shopId);
  if (prevShopId !== shopId) {
    setPrevShopId(shopId);
    setSelectedProductIds([]);
  }

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length >= 6) {
        toast.error(t("seller.banner.ai.productsLimit"));
        return prev;
      }
      return [...prev, id];
    });
  };

  /**
   * Обе цены спрашиваются всегда, но ходит в сеть только нужная: условный вызов
   * хука сломал бы их порядок между рендерами.
   */
  const sellerPrice = useSellerBannerAiControllerPrice({
    query: { enabled: !asAdmin, retry: false, staleTime: 30_000 },
  });
  const adminPrice = useAdminBannerAiControllerPrice({
    query: { enabled: asAdmin, retry: false, staleTime: 30_000 },
  });

  const priceQuery = asAdmin ? adminPrice : sellerPrice;
  const price = priceQuery.data;

  /** Администратору магазин обязателен: без него неоткуда взять, что рисовать. */
  const needsShop = asAdmin && !shopId;
  const blocked = price?.allowed === false;
  const translatable = Boolean(generatedRuKey) && generatedRuKey === currentRuKey;

  const call = (locale: BannerLocale): Promise<GeneratedBannerDto> => {
    const productIds = selectedProductIds.length > 0 ? selectedProductIds : undefined;
    if (locale === "ru") {
      return asAdmin
        ? adminBannerAiControllerGenerateRu({ shopId: shopId!, productIds })
        : sellerBannerAiControllerGenerateRu({ productIds });
    }
    return asAdmin
      ? adminBannerAiControllerGenerateUz({ shopId: shopId!, photoKey: generatedRuKey! })
      : sellerBannerAiControllerGenerateUz({ photoKey: generatedRuKey! });
  };

  const run = async (locale: BannerLocale) => {
    setBusy(locale);
    try {
      const result = await call(locale);

      onGenerated(locale, result);
      if (locale === "ru") setGeneratedRuKey(result.key);

      await priceQuery.refetch();
      toast.success(t(`seller.banner.ai.done.${locale === "ru" ? "ru" : "uz"}`), {
        description:
          result.balance === null
            ? undefined
            : t("seller.banner.ai.left", { balance: result.balance }),
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "seller.banner.ai.failed"));
    } finally {
      setBusy(null);
    }
  };

  const stopped = disabled || blocked || needsShop || busy !== null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          {t("seller.banner.ai.title")}
        </p>
        <p className="text-xs text-muted-foreground">{t("seller.banner.ai.hint")}</p>
      </div>

      {availableProducts.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border/80 bg-muted/30 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">
              {t("seller.banner.ai.productsTitle")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {selectedProductIds.length > 0
                  ? t("seller.banner.ai.productsSelected", { count: selectedProductIds.length })
                  : t("seller.banner.ai.productsAuto")}
              </span>
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="text-[11px] text-primary hover:underline"
                >
                  {t("common.resetAll")}
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("seller.banner.ai.productsHint")}
          </p>

          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto pr-1">
            {availableProducts.map((prod) => {
              const checked = selectedProductIds.includes(prod.id);
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => toggleProduct(prod.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-1.5 text-left text-xs transition-colors",
                    checked
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded border border-border bg-muted">
                    {prod.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={photoUrl(prod.photo) ?? undefined} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-[9px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate">{prod.name}</span>
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void run("ru")}
          disabled={stopped}
        >
          {busy === "ru" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : generatedRuKey ? (
            <RefreshCw className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {t(generatedRuKey ? "seller.banner.ai.againRu" : "seller.banner.ai.makeRu")}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void run("uz-Latn")}
          disabled={stopped || !translatable}
          title={translatable ? undefined : t("seller.banner.ai.uzLocked")}
        >
          {busy === "uz-Latn" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {t("seller.banner.ai.makeUz")}
        </Button>
      </div>

      {busy !== null && (
        <p className="text-xs text-muted-foreground">{t("seller.banner.ai.working")}</p>
      )}

      {needsShop && (
        <p className="text-xs text-muted-foreground">{t("seller.banner.ai.needShop")}</p>
      )}

      {price && !needsShop && (
        <p className={cn("text-xs", blocked ? "text-destructive" : "text-muted-foreground")}>
          {[
            price.balance === null
              ? t("seller.banner.ai.freeForAdmin")
              : t("seller.banner.ai.price", { price: price.price }),
            price.balance !== null && t("seller.banner.ai.balance", { balance: price.balance }),
            blocked && t("seller.banner.ai.noCredits"),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
