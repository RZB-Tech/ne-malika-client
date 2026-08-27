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

export interface AutofillPhoto {
  id: string;
  url: string;
  key?: string;
}

export interface AutofillContext {
  description?: string;
  characteristics?: { key: string; value: string }[];
  categoryId?: number | null;
  state?: "new" | "old";
}

const MAX_PHOTOS = 3;

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
  snapshot: T;
  onApply: (result: AutofilledProductDto) => void;
  onRestore: (snapshot: T) => void;
  onPhotoStored?: (photoId: string, key: string) => void;
  disabled?: boolean;
}) {
  const { t, locale } = useT();
  const [busy, setBusy] = useState(false);
  const [before, setBefore] = useState<T | null>(null);

  const priceQuery = useProductAutofillControllerPrice({
    query: { retry: false, staleTime: 30_000 },
  });
  const quota = priceQuery.data;

  const priceLine = !quota
    ? null
    : quota.unlimited && quota.balance === null
      ? null
      : quota.unlimited
        ? t("ai.autofill.unlimited")
        : quota.free
          ? t("ai.autofill.freeLeft", {
              left: quota.freeLeft ?? 0,
              limit: quota.freeLimit,
            })
          : t("ai.autofill.price", { price: quota.effectivePrice });

  const quotaSpent = Boolean(quota && !quota.free && !quota.unlimited && quota.freeLeft === 0);

  const blocked = quota?.allowed === false;

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
          (characteristic) => characteristic.key.trim() && characteristic.value.trim(),
        ),
        categoryId: context.categoryId ?? undefined,
        state: context.state,
      });

      onApply(result);
      setBefore(captured);
      const fresh = await priceQuery.refetch();
      toast.success(t("ai.autofill.done"), {
        description: filledNote(result, fresh.data?.freeLimit ?? quota?.freeLimit),
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
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
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
          quota?.balance != null && t("ai.autofill.balance", { balance: quota.balance }),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {note && (
        <p className={cn("w-full text-xs", blocked ? "text-destructive" : "text-muted-foreground")}>
          {note}
        </p>
      )}
    </div>
  );
}
