"use client";

import { useState } from "react";
import { Loader2, Undo2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { imageGenControllerRewriteDescription } from "@/lib/api/generated/endpoints/image-gen/image-gen";
import { uploadPhoto, dataUrlToBlob } from "@/lib/api/upload";

/** Фотография в форме: у выбранной только что ключа ещё нет. */
export interface DescriptionPhoto {
  id: string;
  url: string;
  key?: string;
}

/**
 * «Поправить по фото»: модель приводит в порядок текст продавца, сверяясь с
 * фотографией товара.
 *
 * Отменить правку можно соседней кнопкой, а не действием в уведомлении:
 * уведомление живёт четыре секунды, а прочитать новый текст и решить, что
 * прежний был лучше, за это время невозможно.
 */
export function FixDescriptionButton({
  photo,
  name,
  text,
  onResult,
  onPhotoStored,
  disabled,
}: {
  /** Первое фото товара — по нему и сверяемся. */
  photo?: DescriptionPhoto;
  name?: string;
  text: string;
  onResult: (text: string) => void;
  /** Фото могло загрузиться прямо сейчас — ключ нужен и форме. */
  onPhotoStored?: (photoId: string, key: string) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  /** Что было до правки и что предложила модель. */
  const [revision, setRevision] = useState<{
    before: string;
    after: string;
  } | null>(null);

  // Возврат предлагаем, только пока текст — ровно тот, что вернула модель.
  // Стоит человеку начать править его руками, и «вернуть» стёрло бы уже его
  // собственную работу, а не работу модели.
  const canUndo = revision !== null && text === revision.after;

  const run = async () => {
    if (!photo) {
      toast.error(t("ai.description.needPhoto"));
      return;
    }

    setBusy(true);
    try {
      // Фото могло быть выбрано минуту назад и ещё не уехать в S3: модель
      // читает файл оттуда, поэтому сначала догружаем.
      let key = photo.key;
      if (!key) {
        key = await uploadPhoto(dataUrlToBlob(photo.url));
        onPhotoStored?.(photo.id, key);
      }

      const before = text;
      const result = (await imageGenControllerRewriteDescription({
        photoKey: key,
        text,
        name: name?.trim() || undefined,
      })) as unknown as { text: string };

      onResult(result.text);
      setRevision({ before, after: result.text });
      toast.success(t("ai.description.done"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("ai.description.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (!revision) return;
    onResult(revision.before);
    setRevision(null);
  };

  return (
    <div className="flex items-center gap-1.5">
      {canUndo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={undo}
        >
          <Undo2 className="size-3.5" />
          {t("ai.description.undo")}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={run}
        disabled={busy || disabled}
        title={t("ai.description.hint")}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Wand2 className="size-3.5" />
        )}
        {t("ai.description.action")}
      </Button>
    </div>
  );
}
