"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Undo2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import {
  productAutofillControllerFill,
  useProductAutofillControllerPrice,
} from "@/lib/api/generated/endpoints/product-autofill/product-autofill";
import type { AutofilledProductDto } from "@/lib/api/generated/schemas";
import { uploadPhoto, dataUrlToBlob } from "@/lib/api/upload";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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
 * «Заполнить с ИИ»: модель смотрит фотографии и пишет за продавца описание с
 * характеристиками. Нажатие бывает и платным, и бесплатным — как именно, решает
 * тариф магазина.
 *
 * Рядом с кнопкой — строка о том, во что обойдётся нажатие и что для него нужно.
 * Списание без объявленной заранее цены выглядит как обман, даже когда оно
 * честное; «бесплатно» без объявленного остатка — обещание, которое кончится
 * молча; а «нужны фото и название» снимает главный вопрос к кнопке, которая без
 * них только ругается.
 *
 * Размером и видом — как «поправить по фото» рядом с описанием: обе кнопки
 * зовут модель из формы товара, и выделять одну из них панелью значило бы
 * обещать разницу, которой нет.
 *
 * `snapshot` с `onRestore` устроены поверх дженерика намеренно: раскладывают
 * ответ по полям все три формы по-разному (в одной бренд и модель — свои поля,
 * в остальных строки характеристик), и знать про это различие кнопке незачем —
 * она лишь запоминает то, что ей дали, и возвращает по «Вернуть».
 */
export function ProductAutofillButton<T>({
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
  const { t, locale } = useT();
  const [busy, setBusy] = useState(false);
  /** Что было до заполнения; null — заполнения ещё не было или его откатили. */
  const [before, setBefore] = useState<T | null>(null);

  const priceQuery = useProductAutofillControllerPrice({
    query: { retry: false, staleTime: 30_000 },
  });
  const quota = priceQuery.data;

  /**
   * Что написать рядом с кнопкой. Веток четыре, и вывести их из
   * `balance !== null` больше нельзя: у бесплатного нажатия по подписке баланс
   * есть, а цены нет — та проверка объявила бы «10 кредитов» над списанием,
   * которого не будет.
   *
   * Порядок веток — тот же, что у сервера в `autofillCharge`: администратор,
   * безлимит, месячная норма, кредиты. Число берём из `effectivePrice`, а не из
   * `price`: `price` отвечает на вопрос «сколько автозаполнение стоит вообще» и
   * в бесплатных ветках остаётся десяткой.
   */
  const priceLine = !quota
    ? null
    : quota.unlimited && quota.balance === null
      ? // Администратор: за его запросы платит площадка, цены на экране быть не должно.
        null
      : quota.unlimited
        ? t("ai.autofill.unlimited")
        : quota.free
          ? t("ai.autofill.freeLeft", {
              left: quota.freeLeft ?? 0,
              limit: quota.freeLimit,
            })
          : t("ai.autofill.price", { price: quota.effectivePrice });

  /**
   * Месячная норма кончилась. `freeLeft` — число только там, где счётчик
   * вообще есть (это START), поэтому ноль в нём читается однозначно. Без этой
   * строки продавец, которому обещали пять бесплатных заполнений, видит над
   * кнопкой одну лишь цену и считает обещание невыполненным.
   */
  const quotaSpent = Boolean(
    quota && !quota.free && !quota.unlimited && quota.freeLeft === 0,
  );

  /**
   * Нажатие не пройдёт. Смысл `allowed` — «бесплатно ИЛИ хватает кредитов», а
   * не «хватает баланса», поэтому подписчику он ничего не запрещает. Кнопку
   * гасим до клика: первым делом она грузит фотографии в S3, и отказ после
   * загрузки стоил бы продавцу минуты ожидания впустую.
   */
  const blocked = quota?.allowed === false;

  /**
   * Вторая строка — только когда есть что объяснить. `resetsAt` приходит
   * календарной датой, а не моментом: норма сбрасывается в ташкентскую
   * полночь. `new Date("2026-09-01")` разбирается как UTC, и браузер западнее
   * Ташкента показал бы «31 августа»; та же строка со временем разбирается как
   * местная и остаётся тем днём, который написан.
   */
  const note = [
    quotaSpent && t("ai.autofill.freeSpent"),
    quotaSpent &&
      quota?.resetsAt &&
      t("ai.autofill.resets", {
        date: formatDate(`${quota.resetsAt}T00:00:00`, locale),
      }),
    blocked && t("ai.autofill.noCredits"),
  ]
    .filter(Boolean)
    .join(" · ");

  /**
   * Подпись к тосту после заполнения. По `credits > 0` ветки не различаются:
   * ноль списан и у бесплатного нажатия по подписке, и у администратора — но
   * подписчику важно увидеть остаток нормы, а администратору сообщать нечего.
   *
   * Размер нормы в ответе на заполнение не приходит и приходить не должен — он
   * живёт в прайсе, поэтому берётся из свежего ответа `refetch`.
   */
  const filledNote = (
    result: AutofilledProductDto,
    freeLimit: number | undefined,
  ): string | undefined => {
    if (result.credits > 0) {
      return t("ai.autofill.charged", {
        credits: result.credits,
        left: result.balance ?? 0,
      });
    }
    if (!result.free) return undefined;
    if (result.freeLeft === null) return t("ai.autofill.unlimitedCharged");
    if (freeLimit === undefined) return undefined;
    return t("ai.autofill.freeCharged", {
      left: result.freeLeft,
      limit: freeLimit,
    });
  };

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
      /**
       * Это же нажатие изменило и остаток нормы, и остаток кредитов — строку
       * под кнопкой надо перечитать, иначе она продолжит обещать бесплатное
       * заполнение, которого уже нет. Свежий ответ нужен и тосту: размер нормы
       * есть только в прайсе.
       */
      const fresh = await priceQuery.refetch();
      toast.success(t("ai.autofill.done"), {
        description: filledNote(
          result,
          fresh.data?.freeLimit ?? quota?.freeLimit,
        ),
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "ai.autofill.failed"));
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
        disabled={busy || disabled || blocked}
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

      <p className="text-xs text-muted-foreground">
        {[
          priceLine,
          t("ai.autofill.needs"),
          quota?.balance != null &&
            t("ai.autofill.balance", { balance: quota.balance }),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {note && (
        <p
          className={cn(
            "w-full text-xs",
            blocked ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}
