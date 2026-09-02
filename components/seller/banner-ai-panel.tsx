"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Sparkles } from "@/components/icons";
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

  const asAdmin = shopId !== undefined;

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
    if (locale === "ru") {
      return asAdmin
        ? adminBannerAiControllerGenerateRu({ shopId: shopId! })
        : sellerBannerAiControllerGenerateRu({});
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
