"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, Loader2, Sparkles, Undo2 } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import {
  productAutofillControllerFill,
  useProductAutofillControllerPrice,
} from "@/lib/api/generated/endpoints/product-autofill/product-autofill";
import type {
  AutofilledProductDto,
  AutofillPriceDto,
} from "@/lib/api/generated/schemas";
import { uploadPhoto, dataUrlToBlob } from "@/lib/api/upload";

/** Фотография в форме: у выбранной только что ключа ещё нет. */
export interface AutofillPhoto {
  id: string;
  url: string;
  key?: string;
}

/** Что уходит в модель как уже заполненное — она это сохраняет, а не заменяет. */
export interface AutofillContext {
  description?: string;
  characteristics?: { key: string; value: string }[];
  categoryId?: number | null;
  state?: "new" | "old";
}

/**
 * Столько фотографий берёт бэкенд. Больше отправлять незачем: он всё равно
 * отрежет лишние, а загружать их в S3 ради этого продавцу пришлось бы дольше.
 */
const MAX_PHOTOS = 3;

/**
 * «Заполнить карточку с ИИ» — платная кнопка: модель смотрит фотографии и
 * пишет за продавца описание и характеристики.
 *
 * Панелью, а не кнопкой в углу: это не поправка к полю, как «поправить по
 * фото», а способ заполнить карточку целиком, и продавец должен увидеть его до
 * того, как начнёт печатать вручную. Здесь же и цена — списание без объявленной
 * заранее цены выглядит как обман, даже когда оно честное.
 *
 * `snapshot` с `onRestore` устроены поверх дженерика намеренно: раскладывают
 * ответ по полям обе формы по-разному (в одной бренд и модель — свои поля, в
 * другой строки характеристик), и знать про это различие кнопке незачем — она
 * лишь запоминает то, что ей дали, и возвращает по «Вернуть».
 */
export function ProductAutofillCard<T>({
  photos,
  name,
  context,
  snapshot,
  onApply,
  onRestore,
  onPhotoStored,
  disabled,
}: {
  photos: AutofillPhoto[];
  name: string;
  context: AutofillContext;
  /** Значения формы до заполнения — их и вернёт «Вернуть». */
  snapshot: T;
  onApply: (result: AutofilledProductDto) => void;
  onRestore: (snapshot: T) => void;
  /** Фото могли загрузиться прямо сейчас — ключи нужны и форме. */
  onPhotoStored?: (photoId: string, key: string) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  /** Что было до заполнения; null — заполнения ещё не было или его откатили. */
  const [before, setBefore] = useState<T | null>(null);

  const priceQuery = useProductAutofillControllerPrice({
    query: { retry: false, staleTime: 30_000 },
  });
  const quota: AutofillPriceDto | undefined = priceQuery.data;
  const price = quota?.price ?? null;
  const balance = quota?.balance ?? null;

  const ready = photos.length > 0 && name.trim().length >= 2;

  const run = async () => {
    if (photos.length === 0) {
      toast.error(t("ai.autofill.needPhoto"));
      return;
    }
    if (name.trim().length < 2) {
      toast.error(t("ai.autofill.needName"));
      return;
    }

    setBusy(true);
    try {
      /**
       * Ключи новых фотографий получаем здесь, а не при сохранении товара:
       * модель читает файлы из S3, и до загрузки ей нечего показать. Ключ тут же
       * отдаётся форме — иначе то же фото загрузилось бы второй раз при
       * сохранении и в карточке оказался бы дубль.
       */
      const keys: string[] = [];
      for (const photo of photos.slice(0, MAX_PHOTOS)) {
        if (photo.key) {
          keys.push(photo.key);
          continue;
        }
        const key = await uploadPhoto(dataUrlToBlob(photo.url));
        onPhotoStored?.(photo.id, key);
        keys.push(key);
      }

      const captured = snapshot;
      const result = await productAutofillControllerFill({
        photoKeys: keys,
        name: name.trim(),
        description: context.description?.trim() || undefined,
        characteristics: context.characteristics?.filter(
          (characteristic) =>
            characteristic.key.trim() && characteristic.value.trim(),
        ),
        categoryId: context.categoryId ?? undefined,
        state: context.state,
      });

      onApply(result);
      setBefore(captured);
      await priceQuery.refetch();
      toast.success(t("ai.autofill.done"), {
        description:
          result.credits > 0
            ? t("ai.autofill.charged", {
                credits: result.credits,
                left: result.balance ?? 0,
              })
            : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ai.autofill.failed"));
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (before === null) return;
    onRestore(before);
    setBefore(null);
    toast.success(t("ai.autofill.restored"));
  };

  return (
    <Card className="border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-heading text-base font-bold tracking-tight">
            {t("ai.autofill.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("ai.autofill.subtitle")}
          </p>
          {/*
            Оговорка на виду, а не в подсказке кнопки: модель заполняет карточку,
            под которой подпишется продавец, и отвечать за приписанную
            характеристику придётся ему. Прочитать это он должен до нажатия.
          */}
          <p className="text-xs text-muted-foreground/80">
            {t("ai.autofill.hint")}
          </p>
          {price !== null && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Coins className="size-3.5" />
                {t("ai.autofill.price", { price })}
              </span>
              {balance !== null && (
                <span className="tabular">
                  {t("ai.autofill.balance", { balance })}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {before !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={undo}
              disabled={busy}
            >
              <Undo2 className="size-4" />
              {t("ai.autofill.undo")}
            </Button>
          )}
          <Button
            type="button"
            className="gap-2"
            onClick={run}
            disabled={busy || disabled}
            title={ready ? undefined : t("ai.autofill.needBoth")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {busy ? t("ai.autofill.working") : t("ai.autofill.action")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
