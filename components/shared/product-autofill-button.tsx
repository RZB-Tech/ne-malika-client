"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Undo2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import {
  productAutofillControllerFill,
  useProductAutofillControllerPrice,
} from "@/lib/api/generated/endpoints/product-autofill/product-autofill";
import type { AutofilledProductDto } from "@/lib/api/generated/schemas";
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
 * «Заполнить с ИИ» — платная кнопка: модель смотрит фотографии и пишет за
 * продавца описание с характеристиками.
 *
 * Рядом с кнопкой — строка с ценой и тем, что для неё нужно. Списание без
 * объявленной заранее цены выглядит как обман, даже когда оно честное, а
 * «нужны фото и название» снимает главный вопрос к неактивной с виду кнопке.
 *
 * `snapshot` с `onRestore` устроены поверх дженерика намеренно: раскладывают
 * ответ по полям все три формы по-разному (в одной бренд и модель — свои поля,
 * в остальных строки характеристик), и знать про это различие кнопке незачем —
 * она лишь запоминает то, что ей дали, и возвращает по «Вернуть».
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
  const price = priceQuery.data?.price ?? null;
  const balance = priceQuery.data?.balance ?? null;

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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={run}
        disabled={busy || disabled}
        title={t("ai.autofill.hint")}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        {busy ? t("ai.autofill.working") : t("ai.autofill.action")}
      </Button>

      {before !== null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={undo}
          disabled={busy}
        >
          <Undo2 className="size-3.5" />
          {t("ai.autofill.undo")}
        </Button>
      )}

      {price !== null && (
        <p className="text-xs text-muted-foreground">
          {t("ai.autofill.meta", { price })}
          {balance !== null && (
            <span className="tabular">
              {" · "}
              {t("ai.autofill.balance", { balance })}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
