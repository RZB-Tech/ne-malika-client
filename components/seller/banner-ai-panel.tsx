"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import type { BannerLocale } from "@/lib/api/banners";
import {
  sellerBannerAiControllerGenerateRu,
  sellerBannerAiControllerGenerateUz,
  useSellerBannerAiControllerPrice,
} from "@/lib/api/generated/endpoints/banners-seller/banners-seller";
import { cn } from "@/lib/utils";

const ACCENT_MAX = 200;

/**
 * Рисование баннера моделью — два шага, а не один.
 *
 * Сначала русская версия: её видно целиком, и продавец либо перерисовывает, либо
 * принимает. Только принятая картинка уходит на второй шаг, где та же вёрстка
 * получает узбекские надписи. Одной кнопкой «сделай оба» это не собрать: пока
 * человек не сказал «нравится», переводить нечего, а два независимых рисунка
 * разъехались бы по вёрстке и товарам.
 *
 * Кнопка перевода включается, только когда в русском слоте лежит ровно та
 * картинка, которую мы сгенерировали: заменил продавец её своим файлом — и
 * переводить снова нечего.
 */
export function BannerAiPanel({
  currentRuKey,
  onGenerated,
  disabled,
}: {
  currentRuKey: string | undefined;
  onGenerated: (locale: BannerLocale, key: string) => void;
  disabled?: boolean;
}) {
  const { t } = useT();

  const [accent, setAccent] = useState("");
  const [busy, setBusy] = useState<BannerLocale | null>(null);
  const [generatedRuKey, setGeneratedRuKey] = useState<string | null>(null);

  const priceQuery = useSellerBannerAiControllerPrice({
    query: { retry: false, staleTime: 30_000 },
  });
  const price = priceQuery.data;

  const blocked = price?.allowed === false;
  const translatable = Boolean(generatedRuKey) && generatedRuKey === currentRuKey;

  const run = async (locale: BannerLocale) => {
    setBusy(locale);
    try {
      const result =
        locale === "ru"
          ? await sellerBannerAiControllerGenerateRu({
              accent: accent.trim() || undefined,
            })
          : await sellerBannerAiControllerGenerateUz({ photoKey: generatedRuKey! });

      /**
       * Наружу отдаём только ключ: адрес картинки форма собирает тем же
       * `photoUrl`, что и для уже сохранённых баннеров. Ответ сервера ведёт на
       * S3 напрямую, а витрина ходит за картинками через своё же API — превью
       * не должно зависеть от того, откуда картинка взялась.
       */
      onGenerated(locale, result.key);
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          {t("seller.banner.ai.title")}
        </p>
        <p className="text-xs text-muted-foreground">{t("seller.banner.ai.hint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="banner-ai-accent" className="text-xs font-normal text-muted-foreground">
          {t("seller.banner.ai.accent")}
        </Label>
        <Input
          id="banner-ai-accent"
          value={accent}
          maxLength={ACCENT_MAX}
          onChange={(e) => setAccent(e.target.value)}
          /* Поле живёт внутри формы сохранения: без этого Enter сохранял бы баннер. */
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder={t("seller.banner.ai.accentPlaceholder")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void run("ru")}
          disabled={disabled || blocked || busy !== null}
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
          disabled={disabled || blocked || busy !== null || !translatable}
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

      {price && (
        <p className={cn("text-xs", blocked ? "text-destructive" : "text-muted-foreground")}>
          {[
            t("seller.banner.ai.price", { price: price.price }),
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
